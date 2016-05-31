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
  angle = angle / 1 ? angle * 2 : angle / 180;
  angle *= Math.PI;

  return {
    x: Math.cos(angle) * speed + x,
    y: Math.sin(angle) * speed + y
  };
}

meeba.transition()
  .duration(settings.dur)
  .attr('cx', getDest(settings.w / 2, settings.h / 2, settings.angle, settings.speed).x)
  .attr('cy', getDest(settings.w / 2, settings.h / 2, settings.angle, settings.speed).y);
