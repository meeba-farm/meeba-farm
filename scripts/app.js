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
var bounceWall = function() {
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

// Runs each meeba's core tasks
var runTasks = function() {
  var meeba = d3.select(this).datum().core;

  if (!meeba.tasks) return;

  meeba.tasks.forEach(function(task) {
    if (task) task.call(meeba);
  });
};

// Uses a quadtree to allow pairs of nearby meebas to interact
var interact = function() {
  var tree = d3.geom.quadtree(state.bodies);
  var actions = [];
  var met = {};

  state.meebas.each(function() {
    var d = d3.select(this).datum();
    met[d.id] = {};

    tree.visit(function(quad, x1, y1, x2, y2) {
      var stopping = x1 > d.x+d.r || x2 < d.x-d.r || y1 > d.y+d.r || y2 < d.y-d.r;
      var q = quad.point;

      if (!q || q === d) return stopping;
      if (met[q.id] && met[q.id][d.id]) return stopping;
      met[d.id][q.id] = true;

      // Goes through each body's queries, and adds resulting
      // actions to a queue, which is then executed
      d.queries.forEach(function(query) {
        actions.push( query.call(d, q) );
      });

      q.queries.forEach(function(query) {
        actions.push( query.call(q, d) );
      });

      return stopping;
    });
  });

  actions.forEach(function(action) {
    if (action) action();
  });

};

// Adds any new meebas to the tank and starts them moving
var drawMeebas = function() {
  state.meebas = state.tank
    .selectAll('circle')
    .data(state.bodies);

  state.meebas
    .enter()
    .append('circle')
    .attr('id', function(d){ return d.id.slice(1); })
    .attr('r', function(d){ return d.r; })
    .attr('fill', function(d){ return d.core.color; })
    .attr('cx', function(d){ return d.x; })
    .attr('cy', function(d){ return d.y; });

  state.meebas.each(move);
};

/**  SET UP  **/
state.bodies = d3.range(config.quantity).map(function() {
  return new Body( new Meeba() );
});

state.tank = d3.select('body').append('svg')
  .attr('width', config.w)
  .attr('height', config.h);

drawMeebas();


/**  RUN  **/
state.tank.on('click', function() {
  state.bodies.push(new Body(new Meeba(), d3.event.x, d3.event.y));
  
  drawMeebas();
});

d3.timer(function() {
  state.meebas.each(updateXY);
  state.meebas.each(bounceWall);
  interact();
  state.meebas.each(runTasks);
});
