/**  HELPERS  **/

// Moves meeba continuously at the same angle
var move = function() {
  var m = this;
  var meeba = d3.select(m);

  var cx = meeba.attr('cx');
  var cy = meeba.attr('cy');
  var angle = meeba.datum().angle;
  var speed = meeba.datum().speed;

  var dest = getDest(cx, cy, angle, speed);


  meeba.transition()
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
  var buffer = d.speed / config.dur * 10;

  var eastwards = d.angle < 0.25 || d.angle > 0.75;
  var northwards = d.angle < 0.5;
  var westwards = d.angle > 0.25 && d.angle < 0.75;
  var southwards = d.angle > 0.5;

  if (eastwards && d.x > config.w - d.r - 2 * buffer) d.angle = bounceX(d.angle);
  if (northwards && d.y < d.r + buffer) d.angle = bounceY(d.angle);
  if (westwards && d.x < d.r + buffer) d.angle = bounceX(d.angle);
  if (southwards && d.y > config.h - d.r - buffer) d.angle = bounceY(d.angle);

  d3.select(d.id).each(move);
};

// Uses a quadtree to check for collisions between meebas
var checkCollision = function() {
  var tree = d3.geom.quadtree(state.data);

  meebas.each(function() {
    var d = d3.select(this).datum();
    if (d.collided) return;

    tree.visit(function(quad, x1, y1, x2, y2) {
    if (quad.point && (quad.point !== d)) {
      if (quad.point.collided) return;

      var buffer = (d.speed + quad.point.speed) / config.dur * 10;
      var x = d.x - quad.point.x;
      var y = d.y - quad.point.y;
      var dist = Math.sqrt(x * x + y * y);
      var widths = d.r + quad.point.r + buffer;

      if (dist < widths) {
        collide(d, quad.point);
        d3.select(d.id).each(move);
        d3.select(quad.point.id).each(move);
      }
    }
    return x1 > d.x+d.r || x2 < d.x-d.r || y1 > d.y+d.r || y2 < d.y-d.r;
    });
  });
};

// Handles a collision between two meebas
var collide = function(meeba1, meeba2) {
  // Angles can be swapped in collisions of equal mass and speed
  var swap = meeba1.angle;
  meeba1.angle = meeba2.angle;
  meeba2.angle = swap;

  // Hacky workaround to prevent repeated rapid-fire collisions
  meeba1.collided = true;
  meeba2.collided = true;
  setTimeout(function() {
    meeba1.collided = false;
    meeba2.collided = false;
  }, config.dur / 5);
};

/**  SET UP  **/
var tank = d3.select('body').append('svg')
  .attr('width', config.w)
  .attr('height', config.h);

state.data = d3.range(config.quantity).map(() => new Meeba());

var meebas = tank.selectAll('circle')
  .data(state.data)
  .enter()
  .append('circle')
  .attr('id', d => d.id.slice(1))
  .attr('r', d => d.r)
  .attr('fill', d => d.color)
  .attr('cx', d => d.x)
  .attr('cy', d => d.y);


/**  RUN  **/
meebas.each(move);

d3.timer(function() {
  meebas.each(updateXY);
  meebas.each(checkBounce);
  checkCollision();
});
