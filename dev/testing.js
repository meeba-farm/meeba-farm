// Tests to be run manually from the console
// Only accessible from testing.html

// Creates a new meeba and simulates a specified number of generations
var simGen = function(gens, traits) {
  if (traits === undefined) traits = config.traits.max.starter;
  var meeba = new Meeba(traits);

  for (var i = 0; i < gens; i++) {
    meeba.reproduce();
    meeba = meeba.children[0];
  }

  return meeba;
};

// Takes a value and mutates it a specified number of times
var simMutations = function(val, times) {
  for (var i = 0; i < times; i++) {
    val = mutateVal(val);
  }

  return val;
};

var deltaTraits = function(gens, traits) {
  var zero = 0;
  var final = 0;

  for (var i = 0; i < 100; i++) {
    zero += simGen(0, traits).traits.length;
    final += simGen(gens, traits).traits.length;
  }

  return final / zero;
};
