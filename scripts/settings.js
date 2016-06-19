// Config settings, and a global state object

var config = {
  w: window.innerWidth - 20,
  h: window.innerHeight - 20,
  minR: 10,
  spikeW: 0.02,
  quantity: 25,

  moteSpawnRate: 0.1,
  color: '#34A853',
  maxSpeed: 10,
  dur: 100,

  buffer: {
    wall: 40,
    body: 10
  },

  scale: {
    start: 1.5,
    death: 0.5,
    spawn: 2,
    damage: 100
  },

  cost: {
    pixel: 0.002,
    spike: 0.5,
    spawn: 0
  },

  mutate: {
    rate: 0.25,
    spread: 0.5,
    proportion: 10,
  },

  traits: {
    count: {
      min: 20,
      max: 400
    },
    level: {
      min: 0,
      max: 50
    },
    odds: {
      size: 0.95,
      spike: 0.05
    }
  }
};

var state = {
  count: 0
};
