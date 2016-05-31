var tank = d3.select('body').append('svg')
  .attr('width', settings.w)
  .attr('height', settings.h);

var meeba = tank.append('circle')
  .attr('r', settings.r)
  .attr('fill', settings.c)
  .attr('cx', settings.w / 2)
  .attr('cy', settings.h / 2);
