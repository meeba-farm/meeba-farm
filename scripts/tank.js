// Classes, methods, and functions relating to the environment and engine

// An environmental object with information needed to draw and move
// Wraps a `core` which will be a Meeba or similar data
var Body = function(core, x, y, angle, speed) {
  this.core = core;
  this.core.body = this;
  this.id = '#b' + ('00' + state.count++).slice(-3);

  this.r = this.core._r;
  this.x = x || rand(this.r, config.w - this.r);
  this.y = y || rand(this.r, config.h - this.r);

  this.angle = angle || rand();
  this.speed = speed || rand(config.maxSpeed);

  // An array of methods to be run everytime two bodies interact
  this.queries = [this.checkCollision];

  // Collision detection work-rounds
  this.lastHit = '#none';
  this.cantHit = {};
};

// TODO: May need to refactor queries to use some sort of hashtable
// or build off a Query object
Body.prototype.addQuery = function(query) {
  if (this.queries.indexOf(query) === -1) {
    this.queries.push(query);
  }
};

Body.prototype.removeQuery = function(query) {
  var index = this.queries.indexOf(query);

  if (index !== -1) {
    this.queries.splice(index, 1);
  }
};

// Gets a destination x/y for a body
Body.prototype.getDest = function() {
  var vector = breakVector(this.angle, this.speed);
  vector.x += this.x;
  vector.y += this.y;

  return vector;
};

// Checks if a body should bounce off a wall and changes angle accordingly
Body.prototype.bounceWall = function() {
  var buffer = this.speed / config.dur * config.buffer.wall + this.r;

  if (getGap(0, this.angle) < 0.25 && this.x > config.w - buffer) {
    this.angle = bounceX(this.angle);
  } else if (getGap(0.25, this.angle) < 0.25 && this.y < buffer) {
    this.angle = bounceY(this.angle);
  } else if (getGap(0.5, this.angle) < 0.25 && this.x < buffer) {
    this.angle = bounceX(this.angle);
  } else if (getGap(0.75, this.angle) < 0.25 && this.y > config.h - buffer) {
    this.angle = bounceY(this.angle);
  }
};

// Checks to see if a body should collide with another
// Returns an action function to create the collision
Body.prototype.checkCollision = function(body) {
  if (this.lastHit === body && body.lastHit === this) return;
  if (this.cantHit[body.id] || body.cantHit[this.id]) return;

  var buffer = (this.speed + body.speed) / config.dur * config.buffer.body;
  var widths = this.r + body.r + buffer;

  if ( isCloser(this.x, this.y, body.x, body.y, widths) ) {
    var thisBody = this;

    // Two bodies may not collide twice in a row
    this.lastHit = body;
    body.lastHit = this;

    // Two bodies must wait before colliding again
    var cooldown = 2 * (this.r+body.r) / (this.speed+body.speed) * config.dur;
    this.cantHit[body.id] = true;
    body.cantHit[this.id] = true;

    setTimeout(function() {
      thisBody.cantHit[body.id] = false;
      body.cantHit[thisBody.id] = false;
    }, cooldown);


    return function() {
      collide(thisBody, body);

      d3.select(thisBody.id).each(move);
      d3.select(body.id).each(move);
    };
  }
};

// Checks to see if any spikes pierce a body, and returns those drain actions
// Math adapted from Joshua's solution to this question:
// http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
Body.prototype.checkDrain = function(body) {
  var drainers = [];

  for (var i = 0, len = this.core.spikes.length; i < len; i++) {
    var spike = this.core.spikes[i];
    var fullLen = this.r + spike.length;

    // If body is too far, bail completely since spikes are sorted by length
    if (!isCloser(this.x, this.y, body.x, body.y, fullLen + body.r)) break;

    var tip = {
      x: spike.points[0].x + this.x,
      y: spike.points[0].y + this.y
    };
    var dif = {
      x: this.x - tip.x,
      y: this.y - tip.y
    };

    // Parameter is the dot product over squared length
    var dot = dif.x * (body.x-tip.x) + dif.y * (body.y-tip.y);
    var par = dot / sqr(fullLen);

    // If closest point is behind spike, there is no drain
    if (par > 1) continue;

    // Closest point saved to tip
    if (par > 0) {
      tip.x += par * dif.x;
      tip.y += par * dif.y;
    }

    if (isCloser(body.x, body.y, tip.x, tip.y, body.r)) drainers.push(spike);
  }


  // If any spikes are draining, return a function to call them
  if (drainers.length) return function() {
    drainers.forEach(function(spike) {
      spike.drain(body);
    });
  };
};
