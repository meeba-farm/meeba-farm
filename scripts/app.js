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
  var d = d3.select(this).datum();

  var cx = d3.select(this).attr('cx');
  var cy = d3.select(this).attr('cy');
  var buffer = d.speed * 0.02;

  var eastwards = d.angle < 0.25 || d.angle > 0.75;
  var northwards = d.angle < 0.5;
  var westwards = d.angle > 0.25 && d.angle < 0.75;
  var southwards = d.angle > 0.5;

  if (eastwards && cx > config.w - d.r - 2 * buffer) d.angle = bounceX(d.angle);
  if (northwards && cy < d.r + buffer) d.angle = bounceY(d.angle);
  if (westwards && cx < d.r + buffer) d.angle = bounceX(d.angle);
  if (southwards && cy > config.h - d.r - buffer) d.angle = bounceY(d.angle);

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
  .attr('r', d => d.r)
  .attr('fill', d => d.color)
  .attr( 'cx', d => rand(d.r, config.w - d.r) )
  .attr( 'cy', d => rand(d.r, config.h - d.r) )
  .attr( 'id', (d, i) => d.id = 'm' + ('00' + i).slice(-3) );


/**  RUN  **/
meebas.each(move);

d3.timer(function() {
  meebas.each(checkBounce);
});
