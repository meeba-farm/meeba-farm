/**  HELPERS  **/

// Moves meeba continuously at the same angle
var move = function() {
  var d = d3.select(this);
  var dest = d.datum().getDest();

  d.transition()
    .duration(config.dur)
    .ease('linear')
    .attr('cx', dest.x)
    .attr('cy', dest.y)
    .each('end', move);
};

var updateXY = function() {
  var d = d3.select(this).datum();
  d.x = d3.select(this).attr('cx') * 1;
  d.y = d3.select(this).attr('cy') * 1;
};

// Bounces meebas off the walls as needed
var checkBounce = function() {
  var d = d3.select(this).datum();
  var buffer = d.speed / config.dur * config.wallBuffer;

  var eastwards = d.angle <= 0.25 || d.angle > 0.75;
  var northwards = d.angle <= 0.5;
  var westwards = d.angle > 0.25 && d.angle <= 0.75;
  var southwards = d.angle > 0.5;

  if (eastwards && d.x > config.w - d.r - buffer) {
    d.lastHit = '#east-wall';
    d.angle = bounceX(d.angle);
  } else if (northwards && d.y < d.r + buffer) {
    d.lastHit = '#north-wall';
    d.angle = bounceY(d.angle);
  } else if (westwards && d.x < d.r + buffer) {
    d.lastHit = '#west-wall';
    d.angle = bounceX(d.angle);
  } else if (southwards && d.y > config.h - d.r - buffer) {
    d.lastHit = '#south-wall';
    d.angle = bounceY(d.angle);
  }

  d3.select(d.id).each(move);
};

// Uses a quadtree to check for collisions between meebas
var checkCollision = function() {
  var tree = d3.geom.quadtree(state.nodes);

  meebas.each(function() {
    var d = d3.select(this).datum();

    tree.visit(function(quad, x1, y1, x2, y2) {
      if (!collidable(d, quad.point)) return;

      var buffer = (d.speed + quad.point.speed) / config.dur * config.nodeBuffer;
      var x = d.x - quad.point.x;
      var y = d.y - quad.point.y;
      var dist = Math.sqrt(x * x + y * y);
      var widths = d.r + quad.point.r + buffer;

      if (dist < widths) {
        collide(d, quad.point);

        d.lastHit = quad.point;
        quad.point.lastHit = d;

        d3.select(d.id).each(move);
        d3.select(quad.point.id).each(move);
      }

      return x1 > d.x+d.r || x2 < d.x-d.r || y1 > d.y+d.r || y2 < d.y-d.r;
    });
  });
};

// Checks whether or not two nodes have already collided
var collidable = function(node1, node2) {
  if (!node1 || !node2) return false;
  if (node1 === node2) return false;
  if (node1.lastHit === node2 && node2.lastHit === node1) return false;
  return true;
};

/**  SET UP  **/
var tank = d3.select('body').append('svg')
  .attr('width', config.w)
  .attr('height', config.h);

state.nodes = d3.range(config.quantity).map(function() {
  return new Node( new Meeba() );
});

var meebas = tank.selectAll('circle')
  .data(state.nodes)
  .enter()
  .append('circle')
  .attr('id', function(d){ return d.id.slice(1); })
  .attr('r', function(d){ return d.r; })
  .attr('fill', function(d){ return d.item.color; })
  .attr('cx', function(d){ return d.x; })
  .attr('cy', function(d){ return d.y; });


/**  RUN  **/
meebas.each(move);

d3.timer(function() {
  meebas.each(updateXY);
  meebas.each(checkBounce);
  checkCollision();
});
