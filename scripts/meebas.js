// Classes, methods, and functions relating to meebas

var abstractMethodError = "ABSTRACT METHOD CALLED WITHOUT IMPLEMENTATION.";

// A basic meeba, which is only good for food, that Meeba extends
var Mote = function() {
  // Color saved as a 'tinycolor': https://github.com/bgrins/TinyColor
  this.color = tinycolor(config.color);
  this.size = Math.PI * Math.pow(config.minR, 2);

  // An array of methods to be run on each animation frame
  this.tasks = [this.tick, this.decay];

  this.calories = this.size * config.startFactor;
  this.deathLine = this.calories;

  this.upkeep = 0;

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


// Subclass of Mote, these meebas have full functionality
var Meeba = function(_traits, _initialCalories, _environment) { // traits = array of traits, calories = initial calories
  // TODO: Figure out how damage resistance works

  Mote.call(this);
  this.size += Math.PI * Math.pow(rand(config.maxR), 2);

  this.traits = []; // the digital genes of a meeba
  this.isAlive = true;
  this.maxCalories = _initialCalories;
  this.minCalories = this.getMinCalories(); // minimum calories, below which meeba dies
  this.curCalories = this.maxCalories;
  this.criticalHit = this.getCriticalHit(); // max caloric damage taken per turn without dying immediately
  this.damageCurRound = 0; // damage dealt in current round. Reset each round.
  this.environment = _environment;

  // TODO: Refactor spikes array to use traits
  this.spikes = [];
  for (var i = 0; i < rand(config.maxSpikes); i++) {
    this.spikes.push(new Spike(this));
  }

  this.calories = this.size * config.startFactor;
  this.deathLine = this.calories * config.deathFactor;
  this.spawnLine = this.calories * config.spawnFactor;

  this.upkeep += config.fixedCost;
  this.upkeep += this.size * config.pixelCost;
  this.upkeep += this.spikes.length * config.spikeCost;

  this.removeTask(Mote.prototype.decay);
  this.addTask(this.metabolize);
};

Meeba.prototype = Object.create(Mote.prototype);
Meeba.prototype.constructor = Meeba;

Meeba.prototype.getSize = function() { // returns size of meeba.
  // TODO: THIS
  // size should be based on initial calorie count
  return 0;
};
Meeba.prototype.getDeadCalories = function() { // calculates calories of corpse on death. One time calculation.
  // TODO: THIS
  return 0;
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
  
  // returns array with 2 child meebas (with possible mutations) then sets calories to 0 and dies.
  // cost = cost of reproduction (to allow higher costs at higher sizes)
Meeba.prototype.reproduce = function(cost) { 
  var childCals = (curCalories - cost)/2;
  var childOneTraits = [];
  var childTwoTraits = [];
    
  // TODO: Depending on how adding/recopying/skipping genes works, re-write the two below loops
  for (i = 0; i < traits.length; i++) {
    // TODO: Add logic here to re-copy an arbitrary number of traits, to add a random trait, or to skip copying current trait
    childOneTraits.push(traits[i].duplicate());
  }
  for (i = 0; i < traits.length; i++) {
    // TODO: Add logic here to re-copy an arbitrary number of traits, to add a random trait, or to skip copying current trait
    childTwoTraits.push(traits[i].duplicate());
  }
   
  return [Meeba(childOneTraits, childCals, environment), Meeba(childTwoTraits, childCals, environment)];
};
Meeba.prototype.getMinCalories = function() { // calculates minimum number of calories a meeba can have without dying
  // TODO: THIS
  return 0;
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

Meeba.prototype.getCriticalHit = function() { // gets critical hit value for meeba. Calculated once.
  // TODO: THIS
  return 0;
};


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

 // abstract class should never be instantiated
var Trait = function() {
  // returns trait of same type but with random duplication errors
  this.duplicate = function() {throw abstractMethodError;};
  
  //returns EXACT duplicate of trait with no errors
  this.exactDuplicate = function() {throw abstractMethodError;};
  
  // returns # of calories consumed passively by possessing this trait
  this.inactiveConsumeCalories = function() {throw abstractMethodError;};
  
  // returns # of calories consumed when this trait's action is activated (0 if no action or free action)
  this.activeConsumeCalories = function() {throw abstractMethodError;};
  
  // returns action object describing effects carried out by this action when activated (empty if none)
  this.actionEffect = function() {throw abstractMethodError;};
};

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