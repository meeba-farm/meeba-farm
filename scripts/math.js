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

var getDest = function(x, y, angle, speed) {
  // Convert angle from Turn or Degrees into Radians
  angle = Math.abs(angle);
  angle = angle < 1 ? angle * 2 : angle / 180;
  angle *= Math.PI;

  return {
    x: Math.cos(angle) * speed + Number(x),
    y: -Math.sin(angle) * speed + Number(y)
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

var getMass = function(radius) {
  return Math.PI * radius * radius;
};

var getRadians = function(turn) {
  return 2 * Math.PI * turn;
}

var getCollision = function(object1, object2) {
  var m1 = getMass(object1.r), m2 = getMass(object2.r);
  var s1 = object1.speed, s2 = object2.speed;
  var a1 = getRadians(object1.angle), a2 = getRadians(object2.angle);

  
};
