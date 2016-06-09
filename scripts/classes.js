// In-game classes
var abstractMethodError = "ABSTRACT METHOD CALLED WITHOUT IMPLEMENTATION."

var Meeba = function(_traits, _initialCalories, _environment) { // traits = array of traits, calories = initial calories
  this.getSize = function() { // returns size of meeba.
  	// TODO: THIS
  	// size should be based on initial calorie count
  	return 0;
  };
  this.getDeadCalories = function() { // calculates calories of corpse on death. One time calculation.
  	// TODO: THIS
  	return 0;
  };
  this.drainDamage = function(baseDamage) { // calculates and returns damage dealt (based on resistance of meeba). Adds to round damage.
    var endDamage = baseDamage; // TODO: CALCULATE DAMAGE HERE
    this.damageCurRound += endDamage;
    curCalories -= endDamage;
    return endDamage;
  };
  this.feed = function(_calories) { // feeds the meeba the number of calories specified in the arguments
    this.curCalories += _calories;
  }
  this.roundActions = function() { // returns array of all actions to be taken this round
    // TODO: THIS
  };
  this.reproduce = function() { // returns array with 2 child meebas (with possible mutations) then sets calories to 0 and dies.
    // TODO: THIS
  };
  this.getMinCalories = function() { // calculates minimum number of calories a meeba can have without dying
    // TODO: THIS
    return 0;
  }
  this.roundEndCheck = function() { // checks status at end of round and updates accordingly
    if (curCalories < minCalories 
      || damageCurRound >= criticalHit)
    {
      isAlive = false;
      curCalories = getDeadCalories();
    }
    damageCurRound = 0;
  }
  this. getCriticalHit = function() { // gets critical hit value for meeba. Calculated once.
    // TODO: THIS
    return 0;
  }
  
  this.id = '#m' + ('00' + state.count++).slice(-3);
  this.speed = config.speed;
  this.color = config.color;
  
  // REMOVE AND PUT ALL LOCATION INFORMATION IN ENVIRONMENT -->
  this.r = rand(config.minR, config.maxR);
  this.x = rand(this.r, config.w - this.r);
  this.y = rand(this.r, config.h - this.r);
  this.angle = rand();
  // <--  REMOVE AND PUT ALL LOCATION INFORMATION IN ENVIRONMENT
  
  var genes = [];
  var isAlive = true;
  var maxCalories = _initialCalories;
  var minCalories = this.getMinCalories(); // minimum calories, below which meeba dies
  var curCalories = maxCalories;
  var criticalHit = this.getCriticalHit(); // max caloric damage taken per turn without dying immediately
  var damageCurRound = 0; // damage dealt in current round. Reset each round.
   var environment = environment;
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
  REPRODUCE : 3
}

// an action that is to be performed by a meeba
var Action = function(_actionType) { // TODO: CONSIDER WHETHER THEIS SHOULD BE ABSTRACT
  var type = _actionType;
  var actor; // the meeba performing the action
  var target; // the targetted meeba (same as actor if action is on self)
  
  // performs action and sets all states to meebas (hp for damage, calories for eating, etc) as they should be set
  this.doAction = function() {throw abstractMethodError;}; 
}