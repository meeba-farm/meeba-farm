// Classes, methods, and functions relating to the environment and engine

// An environmental object with information needed to draw and move
// Wraps a `core` which will be a Meeba or similar data
var Body = function(core, x, y, r, angle, speed) {
  this.core = core;
  this.core.body = this;
  this.id = '#n' + ('00' + state.count++).slice(-3);

  this.r = r || rand(config.minR, config.maxR);
  this.m = Math.PI * this.r * this.r;
  this.x = x || rand(this.r, config.w - this.r);
  this.y = y || rand(this.r, config.h - this.r);

  this.angle = angle || rand();
  this.speed = speed || rand(config.maxSpeed);

  // An array of methods to be run everytime two bodies interact
  this.queries = [ Body.prototype.getCollision, Body.prototype.getDrain ];

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

// Returns an array of x/y points for each spike
Body.prototype.getSpikes = function() {
  var r = this.r;

  return this.core.spikes.map(function(spike) {
    var points = [];

    points[0] = breakVector(spike.angle, spike.length + r);
    points[1] = breakVector(spike.angle + config.spikeW, r);
    points[2] = breakVector(spike.angle - config.spikeW, r);

    return points.reduce(function(str, point) {
      return str + point.x + ',' + point.y + ' ';
    }, '').slice(0, -1);
  });
};

// Checks to see if a body should collide with another
// Returns an action function to create the collision
Body.prototype.getCollision = function(body) {
  if (this.lastHit === body && body.lastHit === this) return;
  if (this.cantHit[body.id] || body.cantHit[this.id]) return;

  var buffer = (this.speed + body.speed) / config.dur * config.bodyBuffer;
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
  var drains = this.core.spikes.reduce(function(drains, spike) {
    var tip = breakVector(spike.angle, spike.length + thisBody.r);
    tip.x += thisBody.x;
    tip.y += thisBody.y;

    if (getDist(tip.x, tip.y, body.x, body.y) < body.r) {
      drains.push( spike.drain.bind(spike, body) );
    }

    return drains;
  }, []);

  if (drains.length) return function() {
    drains.forEach(function(drain) {
      drain();
    });
  };
};
