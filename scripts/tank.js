// Classes, methods, and functions relating to the environment and engine

// An environmental object with information needed to draw and move
// Wraps a `core` which will be a Meeba or similar data
var Body = function(core, x, y, angle, speed) {
  this.core = core;
  this.core.body = this;
  this.id = '#b' + ('00' + state.count++).slice(-3);

  this.r = Math.sqrt(this.core.size/Math.PI);
  this.x = x || rand(this.r, config.w - this.r);
  this.y = y || rand(this.r, config.h - this.r);

  this.angle = angle || rand();
  this.speed = speed || rand(config.maxSpeed);

  // An array of methods to be run everytime two bodies interact
  this.queries = [this.getCollision, this.getDrain];

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
Body.prototype.getCollision = function(body) {
  if (this.lastHit === body && body.lastHit === this) return;
  if (this.cantHit[body.id] || body.cantHit[this.id]) return;

  var buffer = (this.speed + body.speed) / config.dur * config.buffer.body;
  var distance = getDist(this.x, this.y, body.x, body.y);
  var widths = this.r + body.r + buffer;

  if (distance < widths) {
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

Body.prototype.getDrain = function(body) {
  var thisBody = this;
  var drainers = this.core.spikes.reduce(function(drainers, spike) {
    // First make sure body is not "behind" spike base
    var base = breakVector(spike.angle, thisBody.r);
    base.x += thisBody.x;
    base.y += thisBody.y;
    var baseVect = mergeVector(body.x-base.x, body.y-base.y);
    var baseGap = getGap(spike.angle, baseVect.angle);

    if (baseGap > 0.25) {
      return drainers;
    }

    // Then, if body is ahead of tip, check to see if they overlap
    var tip = breakVector(spike.angle, spike.length + thisBody.r);
    tip.x += thisBody.x;
    tip.y += thisBody.y;
    var tipVect = mergeVector(body.x-tip.x, body.y-tip.y);

    if (getGap(spike.angle, tipVect.angle) < 0.25) {
      if (getDist(tip.x, tip.y, body.x, body.y) < body.r) {
        drainers.push(spike);
      }
      return drainers;
    }

    // Finally, body is between base and tip, check distance from spike
    var dist = Math.sin(getRadians(baseGap)) * baseVect.speed;
    if (dist < body.r) {
      drainers.push(spike);
    }
    return drainers;
  }, []);

  // If any spikes are draining, return a function to call them
  if (drainers.length) return function() {
    drainers.forEach(function(spike) {
      spike.drain(body);
    });
  };
};
