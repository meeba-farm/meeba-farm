// Helper functions for general math calculation

// Scale number based on an exponential factor
var expScale = function(base, factor) {
  return base / Math.pow(base, factor);
};

// Scale per second number based on a number of milliseconds
var msScale = function(num, ms) {
  return num * (ms/1000);
};

// Returns a percentage from 0 to 1, rounds up to 0 or down to 1 as needed
var getPerc = function(fraction, total) {
  var perc = fraction/total;
  if (perc < 0) perc = 0;
  if (perc > 1) perc = 1;
  return perc;
};


/* * * * * * * * * * * * * * * * * * * *
 *             RANDOMNESS              *
 * * * * * * * * * * * * * * * * * * * */

// Convenience random function which can be called a number of ways
var rand = function(start, stop) {
  if (start !== null && typeof start === 'object') {
    return randomKey(start);
  }

  if (start === undefined) start = 0;
  if (stop === undefined) stop = 0;
  if (!arguments.length) stop = 1;

  return Math.random() * (stop - start) + start;
};

var randomKey = function(object) {
  var range = 0;
  for (var key in object) {
    range += isNaN(Number(object[key])) ? 1 : Number(object[key]);
  }

  var roll = rand(range);
  for (var key in object) {
    roll -= isNaN(Number(object[key])) ? 1 : Number(object[key]);
    if (roll < 0) return key;
  }

  console.log('Warning! Random key not selected!');
  return null;
};

// Returns a number on a bell-curve range to the input
var mutateVal = function(num) {
  num = num || 0;

  var rate = rand() < 0.5 ? -1 : 1;
  rate *= Math.abs(num) > config.gene.portion ? num / config.gene.portion : 1;

  var target = config.gene.rate;
  var roll = rand();
  var delta = 0;

  while(roll < target) {
    target *= config.gene.spread;
    delta++;
  }

  return Math.round(rate * delta + num);
};


/* * * * * * * * * * * * * * * * * * * *
 *         PARSING ATTRIBUTES          *
 * * * * * * * * * * * * * * * * * * * */

// Takes in a string attribute and returns an array of any values
var getValues = function(attr) {
  var start = attr.indexOf('(');
  var end = attr.indexOf(')');

  if (start === -1 || end === -1) {
    return console.log('WARNING! Attribute not recognized!', attr);
  }

  return attr.slice(start+1, end).split(',').map(function(num) {
    return Number(num);
  });
};

// Parses a transform string into a useful object
var getPos = function(transform) {
  return transform.split(' ').reduce(function(pos, attr) {
    if (attr.indexOf('rotate') !== -1) {
      pos.rotate = getValues(attr)[0];
    }

    if (attr.indexOf('translate') !== -1) {
      attr = getValues(attr);
      pos.x = attr[0];
      pos.y = attr[1];
    }

    return pos;
  }, {});
};

var setConfig = function(ids, value) {
  var setting = config;
  ids = Array.isArray(ids) ? ids : ids.split('-');

  for (var i = 0; i < ids.length - 1; i++) {
    setting = setting[ ids[i] ];
  }

  if (value !== undefined) {
    setting[ ids[i] ] = value;
  }
  return setting[ ids[i] ];
};
