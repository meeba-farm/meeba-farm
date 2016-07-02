// Classes, methods, and functions relating to meebas


/* * * * * * * * * * * * * * * * * * * *
 *              MEEBAS                 *
 * * * * * * * * * * * * * * * * * * * */

// Creatures capable of eating, dying, and reproducing with mutations
var Meeba = function(genes, calories, family) {

  // The digital genes of a meeba
  this.genome = Array.isArray(genes) ? genes : this.generateGenome(genes);

  // Build stats
  this.size = Math.PI * sqr(config.minR);
  this.spikes = [];
  this.upkeep = 0;
  this.isAlive = true;
  this.readGenome();

  // Various stats calculated based on size
  this.calories = calories || this.size * config.scale.start;
  this.upkeep *= this.size / Math.pow(this.size, config.size.efficiency);
  this.deathLine = this.size * config.scale.death;
  this.spawnLine = this.size * config.scale.spawn;

  // Failsafes in case meebas are spawned with out-of-bounds limits
  if (this.deathLine > this.calories) this.deathLine = this.calories - 50;
  if (this.spawnLine < this.calories) this.spawnLine = this.calories + 50;

  // Builds color based on size, spikes, and family lineage
  this.setupColor(family);

  // Timing and age stats
  this.lastTick = Date.now();
  this.time = 0;
  this.age = 0;

  // Sort spikes by length for faster collision detection
  this.spikes.sort(function(a, b) {
    return b.length - a.length;
  });

  // Meebas added to this array will be spawned by the environment
  this.children = [];

  // An array of methods to be run each animation frame
  this.tasks = [this.tick, this.mature];
};


/*****  TASKS  *****/

Meeba.prototype.addTask = function(task) {
  if (this.tasks.indexOf(task) === -1) this.tasks.push(task);
};

Meeba.prototype.removeTask = function(task) {
  var index = this.tasks.indexOf(task);
  if (index !== -1) this.tasks.splice(index, 1);
};

//Runs basic meeba updates, especially updating their timestamp
Meeba.prototype.tick = function() {
  var now = Date.now();
  this.time = now - this.lastTick;
  this.lastTick = now;
  this.age += this.time;
};

// Runs updates specific to living meebas
Meeba.prototype.metabolize = function() { 
  this.calories -= this.upkeep/1000 * this.time;
  
  var hsl = this.color.toHsl();
  hsl.s = getPerc(this.calories-this.deathLine, this.spawnLine-this.deathLine);
  this.color = tinycolor(hsl);

  if (this.calories < this.deathLine) this.die();
  if (this.calories > this.spawnLine) this.reproduce();
};

// Checks to see if a meeba is old enough to eat
Meeba.prototype.mature = function() {
  if (this.age > config.spawn.cooldown) {
    this.removeTask(this.mature);
    this.addTask(this.metabolize);
    this.body.addQuery(this.body.checkDrain);
  }
  this.fade( getPerc(this.age, config.spawn.cooldown) );
};

// Runs updates specific to dead meebas
Meeba.prototype.decay = function() {
  if (this.calories < 0) this.removeTask(this.decay);
  this.fade( getPerc(this.calories, this.deathLine) );
};


/*****  SPAWNING  *****/

// Builds an array of starter traits for spontaneous meebas
Meeba.prototype.generateGenome = function(max) {
  var genome = [];
  var len = rand(max);

  for (var i = 0; i < len; i++) {
    genome.push(new Gene());
  }

  return genome;
};

// Build core Meeba stats from a trait list
Meeba.prototype.readGenome = function() {
  var meeba = this;
  var read = {
    size: function(level) {
      meeba.size += level;
    },

    spike: function(level, pos) {
      pos /= meeba.genome.length;
      meeba.spikes.push(new Spike(meeba, pos, level));
    }
  };

  this.genome.forEach(function(gene, pos) {
    if (read[gene.type]) read[gene.type](gene.level, pos);
    if (gene.upkeep) meeba.upkeep += gene.upkeep;
  });

  this._r = Math.sqrt(this.size/Math.PI);
  this.spikes.forEach(function(spike) {
    spike.findPoints();
  });
};

Meeba.prototype.setupColor = function(family) {
  if (family === undefined) family = Math.floor(rand(0, 256));
  this._family = family;

  var count = this.genome.reduce(function(count, trait) {
    count[trait.type]++;
    count.total++;
    return count;
  }, {total: 0, spike: 0, size: 0});

  var rgb = {
    r: Math.floor( count.spike / count.total * 255 ),
    g: Math.floor( count.size / count.total * 255 ),
    b: family
  };

  var hsl = tinycolor( rgb ).toHsl();
  hsl.s = getPerc(this.calories-this.deathLine, this.spawnLine-this.deathLine);
  hsl.l = config.lightness;
  this.color = tinycolor(hsl);
  this.fade(0);
};

// Returns a mutated version of the meeba's genes
Meeba.prototype.splitGenome = function() {
  var old = this.genome;
  var mutated = [];
  var len = mutateVal(old.length);

  for (var i = 0; i < len; i++) {
    var index = mutateVal(i);

    if (old[index]) {
      mutated.push(old[index].replicate());
    } else if (old[i]) {
      mutated.push(old[i].replicate());
      mutated.push(old[i].replicate());
    } else if (rand() < 0.5) {
      mutated.push(new Gene());
    } 
  }

  return mutated;
};


/*****  INTERACTION  *****/

// Adjust the alpha on all of the meeba's parts
Meeba.prototype.fade = function(alpha) {
  this.color.setAlpha(alpha);

  this.spikes.forEach(function(spike) {
    spike.color.setAlpha(alpha);
  });
};

// Spawns child meebas with possible mutations, then dies
Meeba.prototype.reproduce = function() {
  var cals = (this.calories - config.spawn.cost) / config.spawn.count;

  for (var i = 0; i < config.spawn.count; i++) {
    this.children.push(new Meeba(this.splitGenome(), cals, this._family));
  }

  this.calories = -Infinity;
  this.decay();
};

// Processes a meeba's death
Meeba.prototype.die = function() {
  this.isAlive = false;
  this.removeTask(this.mature);
  this.removeTask(this.metabolize);
  this.addTask(this.decay);
  this.body.removeQuery(this.body.checkDrain);
};

// Handles a drain against a mote, returning the damage done
Meeba.prototype.sufferDrain = function(damage) { 
  if (this.calories - damage < 0) {
    damage = this.calories > 0 ? this.calories - damage : 0;
    this.calories = -Infinity;
  }

  this.calories -= damage;
  return damage;
};


/* * * * * * * * * * * * * * * * * * * *
 *               GENES                 *
 * * * * * * * * * * * * * * * * * * * */

var Gene = function(type, level) {
  this.type = type || rand(config.gene.odds);

  if (level === undefined) level = rand(config.gene.strength);
  this.level = level < 0 ? 0 : level;

  this.upkeep = config[this.type].cost;
  if (!config[this.type].costFixed) this.upkeep *= this.level;
};

// Creates gene of same type but with mutated level
Gene.prototype.replicate = function() {
  return new Gene( this.type, mutateVal(this.level) );
};

// Creates EXACT copy of gene with no mutations
Gene.prototype.copy = function() {
  return new Gene( this.type, this.level );
};


/* * * * * * * * * * * * * * * * * * * *
 *              SPIKES                 *
 * * * * * * * * * * * * * * * * * * * */

// A simple spike object with length and the angle it is positioned at
var Spike = function(meeba, angle, length) {
  this.meeba = meeba;
  this.angle = angle;
  this.length = length;

  var len = this.length < 1 ? 1 : this.length;
  this.damage = config.spike.damage / Math.pow(len, config.spike.scale);

  this.color = tinycolor(config.spikeColor);
  this.drainCount = 0;
};

// Calculate and store the three points of the spike
Spike.prototype.findPoints = function() {
  this.points = [];
  var r = this.meeba._r;

  this.points[0] = breakVector(this.angle, this.length + r);
  this.points[1] = breakVector(this.angle + config.spikeW, r);
  this.points[2] = breakVector(this.angle - config.spikeW, r);
};

// Return a string of points to be drawn as a polygon
Spike.prototype.getPoints = function() {
  return this.points.reduce(function(str, point) {
    return str + point.x + ',' + point.y + ' ';
  }, '').slice(0, -1);
};

// Drains a body the spike is in contact with
Spike.prototype.drain = function(body) {
  this.meeba.calories += body.core.sufferDrain(this.damage);

  this.color = tinycolor(config.activeSpikeColor);
  this.drainCount++;

  var spike = this;
  setTimeout(function() {
    if (--spike.drainCount === 0) spike.color = tinycolor(config.spikeColor);
  }, config.dur);
};
