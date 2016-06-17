// Helper functions for general math calculation

var rand = function(low, high) {
  if (arguments.length === 1) {
    high = low;
    low = 0;
  }

  if (arguments.length === 0) {
    high = 1;
    low = 0;
  }

  return Math.random() * (high - low) + low;
};

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

var getDist = function(x1, y1, x2, y2) {
  return Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) );
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

// Convert angle from turns into radians
var getRadians = function(turns) {
  return turns * Math.PI * 2;
};

// Break magnitude and angle into x/y vector
var breakVector = function(angle, magnitude) {
  return {
    x: Math.cos( getRadians(angle) ) * magnitude,
    y: -Math.sin( getRadians(angle) ) * magnitude
  };
};

// Takes an x/y vector and combines it to an angle(in turns) and a magnitude
mergeVector = function(x, y) {
  var angle = Math.atan(-y/x) / (2 * Math.PI);
  var speed = Math.sqrt(x * x + y * y);

  // ATan will always return rightwards angles
  if (angle < 0) angle += 1;
  if (x < 0 && y < 0) angle -= 0.5;
  if (x < 0 && y > 0) angle += 0.5;

  return {
    angle: angle,
    speed: speed
  };
};

// Calculate a collision between two bodies, using math outlined here:
// http://vobarian.com/collisions/2dcollisions2.pdf
var collide = function(body1, body2) {
  var m1 = body1.m;
  var m2 = body2.m;
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

// Translates a hex value into a valid RGB array
var parseRGB = function(hex) {
  return hex.replace('#', '').match(/.{1,2}/g).map(function(val) {
    return parseInt(val, 16);
  });
};

// Translates rgb values into a valid hex string
var parseHex = function(rgb) {
  if (typeof rgb === 'string') rgb = getValues(rgb);

  return rgb.reduce(function(hex, val) {
    val = Math.floor(val).toString(16);
    return hex + ('0' + val).slice(-2);
  }, '#');
};
