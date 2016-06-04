/**  HELPERS  **/
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
    .each('end', function() {
      if (angle === meeba.datum().angle) {
        move.call(m);
      } else {
        return true;
      }
    });
};

var checkBounce = function() {
  var meeba = d3.select(this).datum();
  var b = meeba.speed * 0.02;

  var x = d3.select(this).attr('cx');
  var y = d3.select(this).attr('cy');

  var eastwards = meeba.angle < 0.25 || meeba.angle > 0.75;
  var northwards = meeba.angle < 0.5;
  var westwards = meeba.angle > 0.25 && meeba.angle < 0.75;
  var southwards = meeba.angle > 0.5;

  if (eastwards && x > config.w - meeba.r - 2 * b) meeba.angle = bounceX(meeba.angle);
  if (northwards && y < meeba.r + b) meeba.angle = bounceY(meeba.angle);
  if (westwards && x < meeba.r + b) meeba.angle = bounceX(meeba.angle);
  if (southwards && y > config.h - meeba.r - b) meeba.angle = bounceY(meeba.angle);

  move.call(this);
};


/**  SET UP  **/
var tank = d3.select('body').append('svg')
  .attr('width', config.w)
  .attr('height', config.h);

var meebas = tank.selectAll('circle')
  .data( d3.range(config.quantity).map(() => new Meeba()) )
  .enter()
  .append('circle')
  .attr( 'r', (d) => d.r )
  .attr( 'fill', (d) => d.color )
  .attr( 'cx', (d) => d.cx )
  .attr( 'cy', (d) => d.cy );


/**  RUN  **/
meebas.each(move);

d3.timer(function() {
  meebas.each(checkBounce);
});
