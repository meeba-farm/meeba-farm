// Classes, methods, and functions relating to meebas


/* * * * * * * * * * * * * * * * * * * *
 *              MEEBAS                 *
 * * * * * * * * * * * * * * * * * * * */

// Subclass of Mote, these meebas have full functionality
var Meeba = function(traits, calories) {
  this.color = tinycolor(config.color);

  // The digital genes of a meeba
  this.traits = traits || this.getStartTraits();

  // Build stats
  this.size = Math.PI * Math.pow(config.minR, 2);
  this.spikes = [];
  this.upkeep = 0;
  this.buildStats();

  // Various caloric stats based on size
  this.calories = calories || this.size * config.scale.start;
  this.upkeep *= this.size / Math.pow(this.size, config.cost.efficiency);
  this.deathLine = this.size * config.scale.death;
  this.spawnLine = this.size * config.scale.spawn;

  // Failsafe in case meebas are spawned with out-of-bounds limits
  if (this.deathLine > this.calories) this.deathLine = this.calories - 50;
  if (this.spawnLine < this.calories) this.spawnLine = this.calories + 50;

  // Meebas added to this array will be spawned by the environment
  this.children = [];

  // An array of methods to be run each animation frame
  this.tasks = [this.tick, this.metabolize];
  this.lastTick = Date.now();
  this.time = 0;
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
  this.time = (now - this.lastTick)/1000;
  this.lastTick = now;
};

// Runs updates specific to living meebas
Meeba.prototype.metabolize = function() { 
  this.calories -= this.upkeep * this.time;
  
  var hsl = this.color.toHsl();
  hsl.s = getPerc(this.calories-this.deathLine, this.spawnLine-this.deathLine);
  this.color = tinycolor(hsl);

  if (this.calories < this.deathLine) {
    this.isAlive = false;
    this.removeTask(this.metabolize);
    this.addTask(this.decay);
    this.body.removeQuery(this.body.checkDrain);
  }

  if (this.calories > this.spawnLine) {
    this.reproduce();
  }
};

// Runs updates specific to dead meebas
Meeba.prototype.decay = function() {
  if (this.calories < 0) this.removeTask(this.decay);
  var fade = getPerc(this.calories, this.deathLine);

  var rgba = this.color.toRgb();
  rgba.a = fade;
  this.color = tinycolor( rgba );

  this.spikes.forEach(function(spike) {
    var rgba = spike.color.toRgb();
    rgba.a = fade;
    spike.color = tinycolor( rgba );
  });
};


/*****  SPAWNING  *****/

Meeba.prototype.getStartTraits = function() {
  var traits = [];

  for (var i = 0; i < rand(config.traits.count.min, config.traits.count.max); i++) {
    traits.push(new Trait().randomize());
  }

  return traits;
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
};

// Returns a mutated version of the meeba's traits
Meeba.prototype.mutateTraits = function() {
  var old = this.traits;
  var mutated = [];

  for (var i = 0; i < mutateVal(old.length); i++) {
    var index = mutateVal(i);

    if (index < 0) {
      break;
    } else if (!old[index] && !old[i]) {
      mutated.push(new Trait().randomize());
    } else if (!old[index] && old[i]) {
      mutated.push(old[i].duplicate());
      mutated.push(old[i].duplicate());
    } else {
      mutated.push(old[index].duplicate());
    }
  }

  return mutated;
};


/*****  INTERACTION  *****/

// Spawns two child meebas with possible mutations, then dies
Meeba.prototype.reproduce = function() {
  var childCals = (this.calories - config.cost.spawn)/2;

  this.children.push(new Meeba(this.mutateTraits(), childCals));
  this.children.push(new Meeba(this.mutateTraits(), childCals));

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
  this.type = type || 'inactive';
  this.level = level > 0 ? level : 0;

  var traitCosts = {
    inactive: 0,
    size: config.cost.pixel,
    spike: config.cost.spike / this.level
  };

  this.upkeep = this.level * traitCosts[this.type];
};

// returns trait of same type but with random duplication errors
Trait.prototype.duplicate = function() {
  return new Trait( this.type, mutateVal(this.level) );
};

//returns EXACT duplicate of trait with no errors
Trait.prototype.exactDuplicate = function() {
  return new Trait(this.type, this.level);
};

// Randomizes a trait (for spawning totally new ones)
Trait.prototype.randomize = function() {
  var odds = config.traits.odds;
  var roll = rand();
  var total = 0;

  for (var trait in odds) {
    total += odds[trait];
    if (roll < total) {
      this.type = trait;
      break;
    }
  }

  this.level = mutateVal( rand(config.traits.level.min, config.traits.level.max) );

  return this;
};


/* * * * * * * * * * * * * * * * * * * *
 *              SPIKES                 *
 * * * * * * * * * * * * * * * * * * * */

// A simple spike object with length and the angle its positioned at
var Spike = function(meeba, angle, length) {
  this.meeba = meeba;
  this.angle = angle === undefined ? rand() : angle;
  this.length = length === undefined ? rand(config.maxR) : length;
  this.color = tinycolor('black');
  this.damage = config.damage.base / Math.pow(this.length < 1 ? 1 : this.length, config.damage.scale);
  this.drainCount = 0;
};

Spike.prototype.getPoints = function() {
  var points = [];
  var r = this.meeba.body.r;

  points[0] = breakVector(this.angle, this.length + r);
  points[1] = breakVector(this.angle + config.spikeW, r);
  points[2] = breakVector(this.angle - config.spikeW, r);

  return points.reduce(function(str, point) {
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
