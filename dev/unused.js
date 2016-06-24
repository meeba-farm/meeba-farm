// This is older code that is not currently being implemented, 
// but may be useful for reference later.

// THIS CODE WILL NOT RUN


var abstractMethodError = "ABSTRACT METHOD CALLED WITHOUT IMPLEMENTATION.";



var Meeba = function() { // traits = array of traits, calories = initial calories
  // TODO: Figure out how damage resistance works
  this.minCalories = this.getMinCalories(); // minimum calories, below which meeba dies
  this.curCalories = this.maxCalories;
  this.criticalHit = this.getCriticalHit(); // max caloric damage taken per turn without dying immediately
  this.damageCurRound = 0; // damage dealt in current round. Reset each round.
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



// returns # of calories consumed passively by possessing this trait
Trait.prototype.inactiveConsumeCalories = function() {throw abstractMethodError;};

// returns # of calories consumed when this trait's action is activated (0 if no action or free action)
Trait.prototype.activeConsumeCalories = function() {throw abstractMethodError;};

// returns action object describing effects carried out by this action when activated (empty if none)
Trait.prototype.actionEffect = function() {throw abstractMethodError;};


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
