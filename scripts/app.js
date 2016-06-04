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
    y: -Math.sin(angle) * speed + Number(y)
  };
};

var move = function() {
  var meeba = this;
  var cx = d3.select(meeba).attr('cx');
  var cy = d3.select(meeba).attr('cy');
  var angle = settings.angle;
  var dest = getDest(cx, cy, angle, settings.speed);

  d3.select(meeba).transition()
    .duration(settings.dur)
    .ease('linear')
    .attr('cx', dest.x)
    .attr('cy', dest.y)
    .each('end', function() {
      if (angle === settings.angle) {
        move.call(meeba);
      } else {
        return true;
      }
    });
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

var checkBounce = function() {
  var b = settings.speed * 0.02;

  var x = meeba.attr('cx');
  var y = meeba.attr('cy');

  var eastwards = settings.angle < 0.25 || settings.angle > 0.75;
  var northwards = settings.angle < 0.5;
  var westwards = settings.angle > 0.25 && settings.angle < 0.75;
  var southwards = settings.angle > 0.5;

  if (eastwards && x > settings.w - settings.r - 2 * b) settings.angle = bounceX(settings.angle);
  if (northwards && y < settings.r + b) settings.angle = bounceY(settings.angle);
  if (westwards && x < settings.r + b) settings.angle = bounceX(settings.angle);
  if (southwards && y > settings.h - settings.r - b) settings.angle = bounceY(settings.angle);

  meeba.each(move);
};

meeba.each(move);

d3.timer(checkBounce);
