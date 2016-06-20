// Config settings, and a global state object

var config = {
  w: window.innerWidth - 20,
  h: window.innerHeight - 20,
  minR: 10,
  spikeW: 0.025,
  quantity: 25,

  color: '#34A853',
  moteSpawnRate: 0.2,
  maxBodies: 200,
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
    damage: 200
  },

  cost: {
    pixel: 0.002,
    spike: 1,
    spawn: 50
  },

  mutate: {
    rate: 0.1,
    spread: 0.5,
    proportion: 10,
  },

  traits: {
    count: {
      min: 10,
      max: 500
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
