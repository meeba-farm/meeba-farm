// Classes, methods, and functions relating to the environment and engine

// An environmental object with information needed to draw and move
// Wraps an `item` which should be a Meeba or similar data
var Node = function(item, x, y, r, angle, speed) {
  this.item = item;
  this.id = '#n' + ('00' + state.count++).slice(-3);

  this.r = r || rand(config.minR, config.maxR);
  this.m = Math.PI * this.r * this.r;
  this.x = x || rand(this.r, config.w - this.r);
  this.y = y || rand(this.r, config.h - this.r);

  this.angle = angle || rand();
  this.speed = speed || rand(config.maxSpeed);

  this.queries = [ Node.prototype.getCollision ];
};

// Gets a destination x/y for a node
Node.prototype.getDest = function() {
  var vector = breakVector(this.angle, this.speed);
  vector.x += this.x;
  vector.y += this.y;

  return vector;
};

// Checks to see if a node should collide with another
// Returns an action function to create the collision
Node.prototype.getCollision = function(node) {
  if (this.lastHit === node && node.lastHit === this) return;
  var buffer = (this.speed + node.speed) / config.dur * config.nodeBuffer;

  var dist = Math.sqrt( Math.pow(this.x-node.x, 2) + Math.pow(this.y-node.y, 2) );
  var widths = this.r + node.r + buffer;

  if (dist < widths) {
    var thisNode = this;
    this.lastHit = node;
    node.lastHit = this;

    return function() {
      collide(thisNode, node);

      d3.select(thisNode.id).each(move);
      d3.select(node.id).each(move);
    };
  }
};
