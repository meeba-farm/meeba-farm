var tank = d3.select('body').append('svg')
  .attr('width', settings.w)
  .attr('height', settings.h);

var meeba = tank.append('circle')
  .attr('r', settings.r)
  .attr('fill', settings.color)
  .attr('cx', settings.w / 2)
  .attr('cy', settings.h / 2);

var getDest = function(x, y, angle, speed) {
  // Convert angle from Turn or Degrees into Radians
  angle = Math.abs(angle);
  angle = angle < 1 ? angle * 2 : angle / 180;
  angle *= Math.PI;

  return {
    x: Math.cos(angle) * speed + Number(x),
    y: Math.sin(angle) * speed + Number(y)
  };
};

var move = function() {
  var cx = d3.select(this).attr('cx');
  var cy = d3.select(this).attr('cy');
  var dest = getDest(cx, cy, settings.angle, settings.speed);

  d3.select(this).transition()
    .duration(settings.dur)
    .ease('linear')
    .attr('cx', dest.x)
    .attr('cy', dest.y)
    .each('end', move);
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

meeba.each(move);

