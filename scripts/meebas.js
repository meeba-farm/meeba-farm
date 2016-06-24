// Classes, methods, and functions relating to meebas


/* * * * * * * * * * * * * * * * * * * *
 *              MEEBAS                 *
 * * * * * * * * * * * * * * * * * * * */

// Creatures capable of eating, dying, and reproducing with mutations
var Meeba = function(traits, calories, family) {

  // The digital genes of a meeba
  this.traits = Array.isArray(traits) ? traits : this.createTraits(traits);

  // Build stats
  this.isAlive = true;
  this.size = Math.PI * Math.pow(config.minR, 2);
  this.spikes = [];
  this.upkeep = 0;
  this.buildStats();

  // Sort spikes by length for faster collision detection
  this.spikes.sort(function(a, b) {
    return b.length - a.length;
  });

  // Various caloric stats based on size
  this.calories = calories || this.size * config.scale.start;
  this.upkeep *= this.size / Math.pow(this.size, config.cost.efficiency);
  this.deathLine = this.size * config.scale.death;
  this.spawnLine = this.size * config.scale.spawn;

  // Assign a color based on family lineage and traits
  this.setupColor(family);

  // Failsafe in case meebas are spawned with out-of-bounds limits
  if (this.deathLine > this.calories) this.deathLine = this.calories - 50;
  if (this.spawnLine < this.calories) this.spawnLine = this.calories + 50;

  // Meebas added to this array will be spawned by the environment
  this.children = [];

  // An array of methods to be run each animation frame
  this.tasks = [this.tick, this.mature];

  this.lastTick = Date.now();
  this.time = 0;
  this.age = 0;
};


/*****  TASKS  *****/

Meeba.prototype.addTask = function(task) {
  if (this.tasks.indexOf(task) === -1) {
    this.tasks.push(task);
  }
};

Meeba.prototype.removeTask = function(task) {
  var index = this.tasks.indexOf(task);

  if (index !== -1) {
    this.tasks.splice(index, 1);
  }
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

  if (this.calories < this.deathLine) {
    this.isAlive = false;
    this.removeTask(this.mature);
    this.removeTask(this.metabolize);
    this.addTask(this.decay);
    this.body.removeQuery(this.body.checkDrain);
  }

  if (this.calories > this.spawnLine) {
    this.reproduce();
  }
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
Meeba.prototype.createTraits = function(max) {
  var traits = [];
  var len = rand(max);

  for (var i = 0; i < len; i++) {
    traits.push(new Trait());
  }

  return traits;
};

Meeba.prototype.setupColor = function(family) {
  if (family === undefined) family = Math.floor(rand(0, 256));
  this.family = family;

  var count = this.traits.reduce(function(count, trait) {
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

// Build core Meeba stats from a trait list
Meeba.prototype.buildStats = function() {
  var meeba = this;
  var build = {
    size: function(level) {
      meeba.size += level;
    },

    spike: function(level, pos) {
      pos /= meeba.traits.length;
      meeba.spikes.push(new Spike(meeba, pos, level));
    }
  };

  this.traits.forEach(function(trait, pos) {
    if (build[trait.type]) build[trait.type](trait.level, pos);
    if (trait.upkeep) meeba.upkeep += trait.upkeep;
  });

  this._r = Math.sqrt(this.size/Math.PI);
  this.spikes.forEach(function(spike) {
    spike.findPoints();
  });
};

// Returns a mutated version of the meeba's traits
Meeba.prototype.mutateTraits = function() {
  var old = this.traits;
  var mutated = [];
  var len = mutateVal(old.length);

  for (var i = 0; i < len; i++) {
    var index = mutateVal(i);

    if (old[index]) {
      mutated.push(old[index].duplicate());
    } else if (old[i]) {
      mutated.push(old[i].duplicate());
      mutated.push(old[i].duplicate());
    } else if (rand() < 0.5) {
      mutated.push(new Trait());
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

// Spawns two child meebas with possible mutations, then dies
Meeba.prototype.reproduce = function() {
  var childCals = (this.calories - config.cost.spawn)/2;

  this.children.push(new Meeba(this.mutateTraits(), childCals, this.family));
  this.children.push(new Meeba(this.mutateTraits(), childCals, this.family));

  this.calories = -Infinity;
  this.decay();
};

// Handles a drain against a mote, returning the damage done
Meeba.prototype.handleDrain = function(damage) { 
  if (this.calories - damage < 0) {
    damage = this.calories > 0 ? this.calories - damage : 0;
    this.calories = -Infinity;
  }

  this.calories -= damage;
  return damage;
};


/* * * * * * * * * * * * * * * * * * * *
 *              TRAITS                 *
 * * * * * * * * * * * * * * * * * * * */

var Trait = function(type, level) {
  this.type = type || rand(config.traits.odds);

  if (level === undefined) level = rand(config.traits.max.level);
  this.level = level < 0 ? 0 : level;

  var traitCosts = {
    size: this.level * config.cost.pixel,
    spike: config.cost.spike
  };

  this.upkeep = traitCosts[this.type];
};

// returns trait of same type but with random duplication errors
Trait.prototype.duplicate = function() {
  return new Trait( this.type, mutateVal(this.level) );
};

//returns EXACT duplicate of trait with no errors
Trait.prototype.exactDuplicate = function() {
  return new Trait(this.type, this.level);
};


/* * * * * * * * * * * * * * * * * * * *
 *              SPIKES                 *
 * * * * * * * * * * * * * * * * * * * */

// A simple spike object with length and the angle it is positioned at
var Spike = function(meeba, angle, length) {
  this.meeba = meeba;
  this.angle = angle;
  this.length = length;
  this.color = tinycolor('black');
  this.damage = config.damage.base / Math.pow(this.length < 1 ? 1 : this.length, config.damage.scale);
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

// Return a string of points that can be drawn as a polygon
Spike.prototype.getPoints = function() {
  return this.points.reduce(function(str, point) {
    return str + point.x + ',' + point.y + ' ';
  }, '').slice(0, -1);
};

// Drains a body spike is in contact with
Spike.prototype.drain = function(body) {
  this.meeba.calories += body.core.handleDrain(this.damage);

  this.color = tinycolor( 'red' );
  this.drainCount++;

  var spike = this;
  setTimeout(function() {
    if (--spike.drainCount === 0) spike.color = tinycolor( 'black' );
  }, config.dur);
};
