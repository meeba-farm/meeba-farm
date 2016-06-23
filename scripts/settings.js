// Config settings, and a global state object

var config = {
  w: window.innerWidth - 20,
  h: window.innerHeight - 20,
  minR: 10,
  spikeW: 0.025,
  quantity: 15,

  lightness: 40,
  moteSpawnRate: 0.4,
  maxBodies: 100,
  maxSpeed: 10,
  dur: 100,

  buffer: {
    wall: 40,
    body: 10
  },

  scale: {
    start: 1.5,
    death: 0.5,
    spawn: 2
  },

  damage: {
    base: 250,
    scale: 1.025
  },

  cost: {
    pixel: 0.005,
    spike: 24,
    spawn: 100,
    efficiency: 24
  },

  mutate: {
    rate: 0.1,
    spread: 0.5,
    proportion: 10,
    pressure: 2
  },

  traits: {
    max: {
      level: 50,
      mote: 5,
      starter: 100
    },

    odds: {
      size: 20,
      spike: 1
    }
  },

  logStats: true,
  lutLevels: 1024
};

var state = {
  count: 0,
  minutes: 0,
  stats: [],
  averages: []
};

// Cached lookup tables of expensive trig values
var lut = {
  sin: d3.range(config.lutLevels).map(function(d, i) {
    return Math.sin( 2 * Math.PI * i / config.lutLevels );
  }),

  cos: d3.range(config.lutLevels).map(function(d, i) {
    return Math.cos( 2 * Math.PI * i / config.lutLevels );
  }),

  acos: d3.range(config.lutLevels).map(function(d, i) {
    return Math.acos( (i-(config.lutLevels/2)) / (config.lutLevels/2) );
  })
};
