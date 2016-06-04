// Helper functions for general math calculations

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
