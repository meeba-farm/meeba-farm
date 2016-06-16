// Classes, methods, and functions relating to the environment and engine

// An environmental object with information needed to draw and move
// Wraps an `seed` which will be a Meeba or similar data
var Body = function(seed, x, y, r, angle, speed) {
  this.seed = seed;
  this.seed.body = this;
  this.id = '#n' + ('00' + state.count++).slice(-3);

  this.r = r || rand(config.minR, config.maxR);
  this.m = Math.PI * this.r * this.r;
  this.x = x || rand(this.r, config.w - this.r);
  this.y = y || rand(this.r, config.h - this.r);

  this.angle = angle || rand();
  this.speed = speed || rand(config.maxSpeed);

  this.queries = [ Body.prototype.getCollision ];
};

// TODO: May need to refactor queries to use some sort of hashtable
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

// Checks to see if a body should collide with another
// Returns an action function to create the collision
Body.prototype.getCollision = function(body) {
  if (this.lastHit === body && body.lastHit === this) return;
  var buffer = (this.speed + body.speed) / config.dur * config.bodyBuffer;

  var dist = Math.sqrt( Math.pow(this.x-body.x, 2) + Math.pow(this.y-body.y, 2) );
  var widths = this.r + body.r + buffer;

  if (dist < widths) {
    var thisBody = this;
    this.lastHit = body;
    body.lastHit = this;

    return function() {
      collide(thisBody, body);

      d3.select(thisBody.id).each(move);
      d3.select(body.id).each(move);
    };
  }
};
