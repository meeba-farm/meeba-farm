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
