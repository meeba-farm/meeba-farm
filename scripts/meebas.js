// Classes, methods, and functions relating to meebas


/* * * * * * * * * * * * * * * * * * * *
 *              MEEBAS                 *
 * * * * * * * * * * * * * * * * * * * */

// Creatures capable of eating, dying, and reproducing with mutations
var Meeba = function(seed, calories, family) {

  // The digital genes of a meeba
  this.genome = new Genome(seed);

  // Build stats
  this.size = Math.PI * sqr(config.minR);
  this.spikes = [];
  this.upkeep = 0;
  this.genome.read(this);

  // Various stats calculated based on size
  this.calories = calories || this.size * config.scale.start;
  this.upkeep *= expScale(this.size, config.size.efficiency);
  this.deathLine = this.size * config.scale.death;
  this.spawnLine = this.size * config.scale.spawn;

  this.power = this.size * config.size.power;
  this.power *= expScale(this.size, config.size.scale);
  this.drainCount = 0;

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

// Checks to see if a meeba is old enough to eat
Meeba.prototype.mature = function() {
  var cooldown = config.spawn.cooldown * 1000;
  if (this.age > cooldown) {
    this.removeTask(this.mature);
    this.addTask(this.metabolize);
    this.body.addQuery(this.body.checkDrain);
  }
  this.fade( getPerc(this.age, cooldown) );
};

// Runs updates specific to living meebas
Meeba.prototype.metabolize = function() { 
  this.calories -= msScale(this.upkeep, this.time);
  this.drainCount = 0;

  var hsl = this.color.toHsl();
  hsl.s = getPerc(this.calories-this.deathLine, this.spawnLine-this.deathLine);
  this.color = tinycolor(hsl);

  if (this.calories < this.deathLine) this.die();
  if (this.calories > this.spawnLine) this.reproduce();
};

// Runs updates specific to dead meebas
Meeba.prototype.decay = function() {
  if (this.calories < 0) this.removeTask(this.decay);
  this.fade( getPerc(this.calories, this.deathLine) );
};


/*****  INTERACTION  *****/

// Spawns child meebas with possible mutations, then dies
Meeba.prototype.reproduce = function() {
  var cals = (this.calories - config.spawn.cost) / config.spawn.count;

  for (var i = 0; i < config.spawn.count; i++) {
    this.children.push(new Meeba(this.genome, cals, this._family));
  }

  this.calories = -Infinity;
  this.decay();
};

// Processes a meeba's death
Meeba.prototype.die = function() {
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


/*****  COLOR  *****/

Meeba.prototype.setupColor = function(family) {
  if (family === undefined) family = Math.floor(rand(0, 256));
  this._family = family;

  var inspector = this.genome.inspect();

  var rgb = {
    r: Math.floor( inspector.norm.spike * 128 ),
    g: Math.floor( inspector.norm.size * 128 ),
    b: family
  };

  var hsl = tinycolor( rgb ).toHsl();
  hsl.s = getPerc(this.calories-this.deathLine, this.spawnLine-this.deathLine);
  hsl.l = config.lightness;
  this.color = tinycolor(hsl);
  this.fade(0);
};

// Adjust the alpha on all of the meeba's parts
Meeba.prototype.fade = function(alpha) {
  this.color.setAlpha(alpha);

  this.spikes.forEach(function(spike) {
    spike.color.setAlpha(alpha);
  });
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
 *              GENOME                 *
 * * * * * * * * * * * * * * * * * * * */

var Genome = function(seed) {
  if (seed instanceof Genome) {
    this._strand = seed.replicate();
  } else {
    this.generate(seed);
  }
};

// Generates a random set of genes for this genome
Genome.prototype.generate = function(max) {
  this._strand = [];
  var len = rand(max);

  for (var i = 0; i < len; i++) {
    this._strand.push(new Gene());
    this.fuseTail(this._strand, len);
  }
};

// Returns a copy of this genome with mutations
Genome.prototype.replicate = function() {
  var strand = this._strand;
  var mutated = [];
  var len = mutateVal(this.count());

  for (var i = 0; i < len; i++) {
    var index = mutateVal(i);

    if (strand[index]) {
      mutated.push(strand[index].replicate());
    } else if (strand[i]) {
      mutated.push(strand[i].replicate());
      mutated.push(strand[i].replicate());
    } else if (rand() < 0.5) {
      mutated.push(new Gene());
    }

    this.fuseTail(mutated, len);
  }

  return mutated;
};

// Reads the genome and modifies the passed in meeba accordingly
Genome.prototype.read = function(meeba) {
  var count = this.count();
  var rna = {
    size: function(level) {
      meeba.size += level;
    },

    spike: function(level, pos) {
      pos /= count;
      meeba.spikes.push(new Spike(meeba, pos, level));
    }
  };

  this._strand.forEach(function(gene, pos) {
    if (rna[gene.type]) rna[gene.type](gene.level, pos);
    if (gene.upkeep) meeba.upkeep += gene.upkeep;
  });

  // Calculating radius here is necessary to avoid multiple sqrt calls
  meeba._r = Math.sqrt(meeba.size/Math.PI);
  meeba.spikes.forEach(function(spike) {
    spike.findPoints();
  });
};

// Looks at a strand being built and decides whether to fuse the tail
Genome.prototype.fuseTail = function(strand, len) {
  var prev = strand[ strand.length - 2 ];
  var tail = strand[ strand.length - 1 ];

  var fusable = {
    size: false,
    spike: true
  };

  if (!strand || !len || !prev) return;
  if (!fusable[ tail.type ]) return;
  if (prev.type !== tail.type) return;

  prev.level = (prev.level + tail.level) / 2;
  strand.pop();
};

Genome.prototype.count = function() {
  return this._strand.length;
};

// A summary of the genome stats, especially numbers used for colors
Genome.prototype.inspect = function() {
  var i = {count: {total: this.count()}, perc:{}, vary:{}, norm:{}};
  var totalOdds = 0;

  this._strand.forEach(function(gene) {
    i.count[gene.type] = ++i.count[gene.type] || 1;
  });

  for (var type in config.gene.odds) {
    i.count[type] = i.count[type] || 0;
    i.perc[type] = i.count[type] / i.count.total;
    totalOdds += config.gene.odds[type];
  }

  for (type in i.perc) {
    i.vary[type] = i.perc[type] / (config.gene.odds[type] / totalOdds);
    i.norm[type] = i.vary[type]>1 ? i.vary[type]/totalOdds+1 : i.vary[type];
  }

  return i;
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
  this.suction = expScale(len, config.spike.scale);

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
  var damage = this.meeba.power / this.meeba.drainCount * this.suction;
  damage = msScale(damage, this.meeba.time);
  this.meeba.calories += body.core.sufferDrain(damage);

  this.color = tinycolor(config.activeSpikeColor);
  this.drainCount++;

  var spike = this;
  setTimeout(function() {
    if (--spike.drainCount === 0) spike.color = tinycolor(config.spikeColor);
  }, config.dur);
};
