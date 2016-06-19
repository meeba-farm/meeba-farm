// Classes, methods, and functions relating to meebas

var abstractMethodError = "ABSTRACT METHOD CALLED WITHOUT IMPLEMENTATION.";


/* * * * * * * * * * * * * * * * * * * *
 *               MOTES                 *
 * * * * * * * * * * * * * * * * * * * */

// A basic meeba, which is only good for food, that Meeba extends
var Mote = function() {
  // Color saved as a 'tinycolor': https://github.com/bgrins/TinyColor
  this.color = tinycolor(config.color).greyscale();
  this.size = Math.PI * Math.pow(config.minR, 2);

  this.spikes = [];

  this.calories = this.size * config.startFactor;
  this.deathLine = this.calories;
  this.upkeep = 0;

  // An array of methods to be run on each animation frame
  this.tasks = [this.tick, this.decay];
  this.lastTick = Date.now();
  this.time = 0;
};

//Runs basic meeba updates
Mote.prototype.tick = function() {
  var now = Date.now();
  this.time = (now - this.lastTick)/1000;
  this.lastTick = now;
};

// Runs updates specific to dead meebas
Mote.prototype.decay = function() {
  if (this.calories < 0) this.removeTask(this.decay);
  var fade = getPerc(this.calories, this.deathLine);

  var rgba = this.color.toRgb();
  rgba.a = fade;
  this.color = tinycolor( rgba );

  return fade;
};

Mote.prototype.addTask = function(task) {
  if (this.tasks.indexOf(task) === -1) {
    this.tasks.push(task);
  }
};

Mote.prototype.removeTask = function(task) {
  var index = this.tasks.indexOf(task);

  if (index !== -1) {
    this.tasks.splice(index, 1);
  }
};


/* * * * * * * * * * * * * * * * * * * *
 *              MEEBAS                 *
 * * * * * * * * * * * * * * * * * * * */

// Subclass of Mote, these meebas have full functionality
var Meeba = function(traits, calories) { // traits = array of traits, calories = initial calories
  // TODO: Figure out how damage resistance works
  Mote.call(this);

  // the digital genes of a meeba
  this.traits = traits || this.getStartTraits();

  this.color = tinycolor(config.color);
  this.size += Math.PI * Math.pow(rand(config.maxR), 2);

  this.isAlive = true;
  this.maxCalories = _initialCalories;
  this.minCalories = this.getMinCalories(); // minimum calories, below which meeba dies
  this.curCalories = this.maxCalories;
  this.criticalHit = this.getCriticalHit(); // max caloric damage taken per turn without dying immediately
  this.damageCurRound = 0; // damage dealt in current round. Reset each round.
  this.environment = _environment;

  // TODO: Refactor spikes array to use traits
  for (var i = 0; i < rand(config.maxSpikes); i++) {
    this.spikes.push(new Spike(this));
  }

  this.calories = calories || this.size * config.startFactor;
  this.deathLine = this.calories * config.deathFactor;
  this.spawnLine = this.calories * config.spawnFactor;

  this.upkeep += config.fixedCost;
  this.upkeep += this.size * config.pixelCost;
  this.upkeep += this.spikes.length * config.spikeCost;

  // Meebas added to this array will be spawned by the environment
  this.children = [];

  this.removeTask(Mote.prototype.decay);
  this.addTask(this.metabolize);
};

Meeba.prototype = Object.create(Mote.prototype);
Meeba.prototype.constructor = Meeba;

Meeba.prototype.getStartTraits = function() {
  var traits = [];

  for (var i = 0; i < config.minTraits; i++) {
    traits.push(new Trait().randomize());
  }

  while (rand() < config.moreTraitRate) {
    traits.push(new Trait().randomize());
  }

  return traits;
};

Meeba.prototype.drainDamage = function(baseDamage) { // calculates and returns damage dealt (based on resistance of meeba). Adds to round damage.
  var endDamage = baseDamage; // TODO: CALCULATE DAMAGE HERE
  this.damageCurRound += endDamage;
  curCalories -= endDamage;
  return endDamage;
};

Meeba.prototype.feed = function(_calories) { // feeds the meeba the number of calories specified in the arguments
  this.curCalories += _calories;
};
  
  // returns array of all actions to be taken this round
Meeba.prototype.roundActions = function() { 
  var ret = [];
  for (i = 0; i < traits.length; i++) {
    var traitAction = traits[i].getActionEffect();
    if (traitAction.type == ActionEnum.NOTHING) {
      continue;
    }
    ret.push(traitAction);
  }
  return ret;
};
  
// Creates two child meebas (with possible mutations) then sets calories to 0 and dies.
Meeba.prototype.reproduce = function() {
  var childCals = (this.calories - config.spawnCost)/2;

  this.children.push(new Meeba(this.mutateTraits(), childCals));
  this.children.push(new Meeba(this.mutateTraits(), childCals));

  this.calories = 0;
  this.decay();
};

Meeba.prototype.mutateTraits = function() {
  var traits = [];

  for (var i = 0; i < mutateVal(this.traits.length); i++) {
    var index = mutateVal(i);

    if (index < 0) {
      break;
    } else if (!this.traits[index] && !this.traits[i]) {
      traits.push(new Trait().randomize());
    } else if (!this.traits[index] && this.traits[i]) {
      traits.push(this.traits[i].duplicate());
      traits.push(this.traits[i].duplicate());
    } else {
      traits.push(this.traits[index].duplicate());
    }
  }

  return traits;
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
    this.body.removeQuery(this.body.getDrain);
  }

  if (this.calories > this.spawnLine) {
    this.reproduce();
  }
};

// Runs updates specific to dead meebas
Meeba.prototype.decay = function() {
  var fade = Mote.prototype.decay.call(this);

  this.spikes.forEach(function(spike) {
    var rgba = spike.color.toRgb();
    rgba.a = fade;
    spike.color = tinycolor( rgba );
  });
};

Meeba.prototype.getSize = function() { // returns size of meeba.
  // TODO: THIS
  // size should be based on initial calorie count
  return 0;
};

Meeba.prototype.getDeadCalories = function() { // calculates calories of corpse on death. One time calculation.
  // TODO: THIS
  return 0;
};

Meeba.prototype.getMinCalories = function() { // calculates minimum number of calories a meeba can have without dying
  // TODO: THIS
  return 0;
};

Meeba.prototype.getCriticalHit = function() { // gets critical hit value for meeba. Calculated once.
  // TODO: THIS
  return 0;
};


/* * * * * * * * * * * * * * * * * * * *
 *              TRAITS                 *
 * * * * * * * * * * * * * * * * * * * */

var Trait = function(type, level) {
  this.type = type || 'inactive';
  this.level = level > 0 ? level : 0;

  var traitCosts = {
    inactive: 0,
    size: config.pixelCost,
    spike: config.spikeCost / this.level
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
  var chances = config.traitChances;
  var total = chances.keys.reduce(function(total, trait) {
    return total + chances[trait];
  }, 0);
  var roll = rand(total);

  for (var trait in chances) {
    total -= chances[trait];
    if (chances[trait] > total) {
      this.type = trait;
      break;
    }
  }

  this.level = mutateVal( rand(config.startMin, config.startMax) );

  return this;
};

// returns # of calories consumed passively by possessing this trait
Trait.prototype.inactiveConsumeCalories = function() {throw abstractMethodError;};

// returns # of calories consumed when this trait's action is activated (0 if no action or free action)
Trait.prototype.activeConsumeCalories = function() {throw abstractMethodError;};

// returns action object describing effects carried out by this action when activated (empty if none)
Trait.prototype.actionEffect = function() {throw abstractMethodError;};


/* * * * * * * * * * * * * * * * * * * *
 *              SPIKES                 *
 * * * * * * * * * * * * * * * * * * * */

// A simple spike object with length and the angle its positioned at
var Spike = function(meeba, angle, length) {
  this.meeba = meeba;
  this.angle = angle === undefined ? rand() : angle;
  this.length = length === undefined ? rand(config.maxR) : length;
  this.color = tinycolor('black');
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
// TODO: Implement effect other than color change
Spike.prototype.drain = function(body) {
  var damage = config.damageFactor / this.length;
  this.meeba.calories += damage;
  body.core.calories -= damage;

  this.color = tinycolor( 'red' );
  this.drainCount++;

  var spike = this;
  setTimeout(function() {
    if (--spike.drainCount === 0) spike.color = tinycolor( 'black' );
  }, config.dur);
};


/* * * * * * * * * * * * * * * * * * * *
 *          CONDITION NODES            *
 * * * * * * * * * * * * * * * * * * * */

// a condition to be tested on either a local meeba or its surroundings
var ConditionNode = function() {
  // TODO: THIS
  this.conditionMet = function() { // returns true if condition met, false otherwise
    // TODO: THIS
  };
};

var ConditionList = function() {
  var conditions = [];
  
  var addCondition = function(condition) {
    if (!condition instanceof ConditionNode) {
      throw "Only conditions may be added to conditionlist.";  
    }
    conditions.push(condition);
  };
  
  // tests whether all conditions are met
  var conditionsMet = function() {
    var ret = true;
    for (i = 0; i < conditions.length; i++) {
      if (conditions[i].conditionMet() == false) {
        ret = false;
        break;
      }
    }
    return ret;
  };
};


/* * * * * * * * * * * * * * * * * * * *
 *              ACTIONS                *
 * * * * * * * * * * * * * * * * * * * */

// the type for actions
var ActionEnum = {
  DRAIN : 0, // drain calories from target meeba OR eat from dead meeba
  ATTACK : 1, // deal damage to target meeba
  MOVE : 2, // move the meeba along a vector path
  REPRODUCE : 3,
  NOTHING : 4
};

// an action that is to be performed by a meeba
var Action = function(_actionType) { // TODO: CONSIDER WHETHER THEIS SHOULD BE ABSTRACT
  var type = _actionType;
  var actor; // the meeba performing the action
  var target; // the targetted meeba (same as actor if action is on self)
  
  // performs action and sets all states to meebas (hp for damage, calories for eating, etc) as they should be set
  this.doAction = function() {throw abstractMethodError;}; 
};
