// Helper functions for general math calculation


// Returns a percentage from 0 to 1, rounds up to 0 or down to 1 as needed
var getPerc = function(fraction, total) {
  var perc = fraction/total;
  if (perc < 0) perc = 0;
  if (perc > 1) perc = 1;
  return perc;
};

// Uses a lookup table to quickly get sine for an angle in turns
var getSin = function(turns) {
  return lut.sin[ getTurnIndex(turns) ];
};

var getCos = function(turns) {
  return lut.cos[ getTurnIndex(turns) ];
};

var getTurnIndex = function(turns) {
  return Math.floor( roundAngle(turns) * config.lutLevels );
};

var getAcos = function(ratio) {
  var index = Math.floor(ratio * config.lutLevels/2 + config.lutLevels/2);
  return lut.acos[index];
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
  rate *= Math.abs(num) > config.mutate.proportion ? num / config.mutate.proportion : 1;

  var target = config.mutate.rate;
  var roll = rand();
  var delta = 0;

  while(roll < target) {
    target *= config.mutate.spread;
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


/* * * * * * * * * * * * * * * * * * * *
 *             2D SPACE                *
 * * * * * * * * * * * * * * * * * * * */

// Compares a line defined by four points to a fixed distance without sqrt
var isCloser = function(x1, y1, x2, y2, distance) {
  return (x1-x2) * (x1-x2) + (y1-y2) * (y1-y2) < distance * distance;
};

// Normalizes an angle (in turns) to be between 0 and 1
var roundAngle = function(turns) {
  if (turns >= 0 && turns < 1) return turns;
  if (turns >= 1) return turns % 1;
  if (turns < 0) return turns + Math.ceil(Math.abs(turns));
};

// Returns the size of the gap between two angles
var getGap = function(angle1, angle2) {
  angle1 = roundAngle(angle1);
  angle2 = roundAngle(angle2);

  var diff = angle1 - angle2;

  if (Math.abs(diff) > 0.5) {
    if (diff < 0) diff += 1;
    else diff -= 1;
  }

  return Math.abs(diff);
};

// Break magnitude and angle into x/y vector
var breakVector = function(angle, magnitude) {
  return {
    x: getCos(angle) * magnitude,
    y: -getSin(angle) * magnitude
  };
};

// Takes an x/y vector and combines it to an angle(in turns) and a magnitude
mergeVector = function(x, y) {
  var speed = Math.sqrt(x * x + y * y);
  var angle = getAcos(x/speed) / (2 * Math.PI);

  // ACos always gives northwards angles, check if should be southwards
  if (y > 0) angle = 1 - angle; 

  return {
    angle: angle,
    speed: speed
  };
};

var bounceX = function(angle) {
  if (angle === 0.5) return 0;
  if (angle < 0.5) return 0.25 - (angle - 0.25);
  return 0.75 - (angle - 0.75);
};

var bounceY = function(angle) {
  if (angle === 0) return 0;
  if (angle < 0.25 || angle > 0.75) return 1 - angle;
  return 0.5 - (angle - 0.5);
};

// Calculate a collision between two bodies, using math outlined here:
// http://vobarian.com/collisions/2dcollisions2.pdf
var collide = function(body1, body2) {
  var m1 = body1.core.size;
  var m2 = body2.core.size;
  var v1 = breakVector(body1.angle, body1.speed); 
  var v2 = breakVector(body2.angle, body2.speed);

  // Calculate unit normal vector and unit tangent vector
  var n = {x: body2.x-body1.x, y: body2.y-body1.y};
  var mn = Math.sqrt(n.x * n.x + n.y * n.y);
  var un = {x: n.x / mn, y: n.y / mn};
  var ut = {x: -un.y, y: un.x};

  // Calculate scalar velocities on the normal and the tangent
  var vn1 = un.x * v1.x + un.y * v1.y;
  var vt1 = ut.x * v1.x + ut.y * v1.y;
  var vn2 = un.x * v2.x + un.y * v2.y;
  var vt2 = ut.x * v2.x + ut.y * v2.y;

  // Calculate final velocites along the normal (tangent will not change)
  var vn1_f = ( vn1*(m1-m2) + 2*m2*vn2 ) / (m1+m2);
  var vn2_f = ( vn2*(m2-m1) + 2*m1*vn1 ) / (m1+m2);

  // Convert scalar velocities back into vectors
  vn1_f = {x: vn1_f * un.x, y: vn1_f * un.y};
  vt1   = {x: vt1   * ut.x, y: vt1   * ut.y};
  vn2_f = {x: vn2_f * un.x, y: vn2_f * un.y};
  vt2   = {x: vt2   * ut.x, y: vt2   * ut.y};

  // Calculate final vectors, by adding normal and tangent vectors
  v1 = {x: vn1_f.x + vt1.x, y: vn1_f.y + vt1.y};
  v2 = {x: vn2_f.x + vt2.x, y: vn2_f.y + vt2.y};

  // Convert back to angle (in turns) and magntitude and save to bodies
  v1 = mergeVector(v1.x, v1.y);
  v2 = mergeVector(v2.x, v2.y);

  body1.speed = v1.speed;
  body1.angle = v1.angle;
  body2.speed = v2.speed;
  body2.angle = v2.angle;
};
