// Sets up and runs the actual D3 engine


/* * * * * * * * * * * * * * * * * * * *
 *              UPKEEP                 *
 * * * * * * * * * * * * * * * * * * * */

// Updates state.meebas with the current data
var refreshData = function() {
  state.meebas = state.tank
    .selectAll('g')
    .data(state.bodies);
};

// Apply environment changes to the datum, and vice versa
var syncDatum = function(d) {
  var current = d3.select(this);

  var pos = getPos( current.attr('transform') );
  d.x = pos.x;
  d.y = pos.y;

  current.select('circle')
    .attr('fill', d.core.color.toRgbString());

  current.selectAll('polygon')
    .each(function(d, i){
      d3.select(this)
        .attr('fill', d.core.spikes[i].color.toRgbString());
    });

  if (d.core.children && d.core.children.length) {
    spawnChildren(d);
  }

  if (d.core.calories < 0) {
    removeSelection(current);
  }
};

// Runs each body's core tasks
var runTasks = function(d) {
  if (!d.core.tasks) return;

  d.core.tasks.forEach(function(task) {
    if (task) task.call(d.core);
  });
};


/* * * * * * * * * * * * * * * * * * * *
 *          DRAWING BODIES             *
 * * * * * * * * * * * * * * * * * * * */

var spawnMote = function() {
  if (state.bodies.length < config.mote.max) {
    state.bodies.push(new Body( new Meeba(config.mote.genes) ));
    drawMeebas();
  }
  setTimeout(spawnMote, rand(2000/config.mote.rate));
};

var spawnChildren = function(body) {
  var displace = -0.125;

  while(body.core.children.length) {
    state.bodies.push(new Body(
      body.core.children.pop(),
      body.x + breakVector(body.angle + displace, 2*body.r).x,
      body.y + breakVector(body.angle + displace, 2*body.r).y,
      body.angle + displace,
      body.speed
    ));
    //NOTE: refactor `displace` if more than four children
    displace += 0.25;
  }

  drawMeebas();
};

// Adds any new meebas to the tank and starts them moving
var drawMeebas = function() {
  refreshData();

  var newMeebas = state.meebas
    .enter()
    .append('g')
    .attr('id', function(d){ return d.id.slice(1); })
    .attr('transform', function(d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    });

  newMeebas.each(function() {
    var current = d3.select(this);
    current.datum().core.spikes.forEach(function(spike) {
      current.append('polygon')
        .attr('fill', spike.color.toRgbString())
        .attr('points', spike.getPoints());
    });
  });

  newMeebas.append('circle')
    .attr('r', function(d){ return d.r; })
    .attr('fill', function(d){ return d.core.color.toRgbString(); });

  state.meebas.each(move);
};

var removeSelection = function(current) {
  state.bodies.splice(state.bodies.indexOf(current.datum()), 1);
  current.remove();
  refreshData();
};


/* * * * * * * * * * * * * * * * * * * *
 *          MOVING BODIES              *
 * * * * * * * * * * * * * * * * * * * */

// Moves meeba continuously at the same angle
var move = function() {
  var current = d3.select(this);
  var dest = current.datum().getDest();

  current.transition()
    .duration(config.dur)
    .ease('linear')
    .attr('transform', 'translate(' + dest.x + ',' + dest.y + ')')
    .each('end', move);
};

// Bounces meebas off the walls as needed
var resolveBounce = function(d) {
  var prevAngle = d.angle;
  d.bounceWall();

  if (d.angle !== prevAngle) {
    d.lastHit = '#wall';
    d3.select(this).each(move);
  }
};

// Uses a quadtree to allow pairs of nearby meebas to interact
var interact = function() {
  var tree = d3.geom.quadtree(state.bodies);
  var actions = [];
  var met = {};

  state.meebas.each(function(d) {
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


/* * * * * * * * * * * * * * * * * * * *
 *           STAT TRACKING             *
 * * * * * * * * * * * * * * * * * * * */

// Saves an array of current stats about every meeba
var sumStats = function() {
  return state.bodies.reduce(function(stats, body) {
    stats.count++;
    stats.cal += body.core.calories < 0 ? 0 : body.core.calories;
    stats.genome += body.core.genome.count();
    stats.size += body.core.size;
    stats.spikes += body.core.spikes.length;
    stats.spikeLength += body.core.spikes.reduce(function(total, spike) {
      return total + spike.length;
    }, 0);
    return stats;
  }, {count:0, cal: 0, genome: 0, size: 0, spikes: 0, spikeLength: 0});
};

// Gathers and logs stats about the current meebas
var logStats = function() {
  var stats = sumStats();
  var avg = {};

  for (var stat in stats) {
    stats[stat] = Math.floor(stats[stat]);
    avg[stat] = Math.floor(stats[stat] / stats.count);
  }

  state.stats.push(stats);
  state.averages.push(avg);

  console.log('\n',
    '===== ', ++state.minutes, 'minutes  =====',

    '\nBODIES:\n',
    'total:', stats.count, ' delta:', (stats.count/state.stats[0].count+'').slice(0, 5), '\n',

    '\nCALORIES:\n',
    'total:', stats.cal, ' delta:', (stats.cal/state.stats[0].cal+'').slice(0, 5), '\n',
    'average:', avg.cal, ' delta:', (avg.cal/state.averages[0].cal+'').slice(0, 5), '\n',

    '\nGENES:\n',
    'total:', stats.genome, ' delta:', (stats.genome/state.stats[0].genome+'').slice(0, 5), '\n',
    'average:', avg.genome, ' delta:', (avg.genome/state.averages[0].genome+'').slice(0, 5), '\n',

    '\nSIZE:\n',
    'total:', stats.size, ' delta:', (stats.size/state.stats[0].size+'').slice(0, 5), '\n',
    'average:', avg.size, ' delta:', (avg.size/state.averages[0].size+'').slice(0, 5), '\n',

    '\nSPIKES:\n',
    'count:', stats.spikes, ' delta:', (stats.spikes/state.stats[0].spikes+'').slice(0, 5), '\n',
    'average:', avg.spikes, ' delta:', (avg.spikes/state.averages[0].spikes+'').slice(0, 5), '\n',
    'length:', stats.spikeLength, ' delta:', (stats.spikeLength/state.stats[0].spikeLength+'').slice(0, 4), '\n',
    'average:', avg.spikeLength, ' delta:', (avg.spikeLength/state.averages[0].spikeLength+'').slice(0, 4), '\n',
  '\n');
};


/* * * * * * * * * * * * * * * * * * * *
 *              SET UP                 *
 * * * * * * * * * * * * * * * * * * * */

var populate = function(){
  state.bodies = d3.range(config.starter.count).map(function() {
    return new Body( new Meeba(config.starter.genes) );
  });

  drawMeebas();
};

var setInerfaceVals = function() {
  d3.selectAll('input').each(function() {
    this.value = setConfig(this.id);
  });

  d3.selectAll('.range > input').each(function() {
    d3.select(this.nextElementSibling).text(this.value);
  });
};

state.tank = d3.select('body').append('svg')
  .attr('width', config.w)
  .attr('height', config.h);

state.bodies.on('click', function() {
  state.bodies.push(new Body(
    new Meeba(config.starter.genes),
    d3.event.x,
    d3.event.y
  ));
  drawMeebas();
});

d3.selectAll('input').on('input', function() {
  setConfig(this.id, this.value);
  localStorage.setItem(config.location, JSON.stringify(config));
});

d3.selectAll('.range > input').on('input', function() {
  d3.select(this.nextElementSibling).text(this.value);
});

d3.select('#reset-meebas').on('click', function() {
  state.bodies = [];
  state.meebas.remove();
  refreshData();
  populate();
});

d3.select('#restore-defaults').on('click', function() {
  localStorage.setItem(config.location, null);
  config = defaults;
  setInerfaceVals();
});

d3.select('#show-ui').on('click', function() {
  d3.select('#config').transition()
    .duration(config.animationTime)
    .style('top', '4vh')
    .style('display', 'block');

  d3.select('#footer').transition()
    .duration(config.animationTime)
    .style('top', '82vh')
    .style('display', 'block');

  d3.select('#show-ui').transition()
    .duration(config.animationTime)
    .attr('right', '-4em')
    .style('display', 'none');

  d3.select('#hide-ui').transition()
    .duration(config.animationTime)
    .attr('right', '0.7em')
    .style('display', 'block');
});

var hideUI = function() {
  d3.select('#config').transition()
    .duration(config.animationTime)
    .style('top', '-78vh')
    .style('display', 'none');

  d3.select('#footer').transition()
    .duration(config.animationTime)
    .style('top', '104vh')
    .style('display', 'none');

  d3.select('#show-ui').transition()
    .duration(config.animationTime)
    .style('right', '0.7em')
    .style('display', 'block');

  d3.select('#hide-ui').transition()
    .duration(config.animationTime)
    .attr('right', '-4em')
    .style('display', 'none');
};

d3.select('#hide-ui').on('click', hideUI);
d3.select('#done').on('click', hideUI);

/* * * * * * * * * * * * * * * * * * * *
 *                RUN                  *
 * * * * * * * * * * * * * * * * * * * */

populate();
setInerfaceVals();

d3.timer(function() {
  state.meebas.each(syncDatum);
  state.meebas.each(resolveBounce);
  interact();
  state.meebas.each(runTasks);
});

spawnMote();

if (config.logStats) {
  setInterval(function() {
    logStats();
  }, 60000);
}
