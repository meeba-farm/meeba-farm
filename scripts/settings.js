// Config settings, and a global state object

var config = {
  w: window.innerWidth - 20,
  h: window.innerHeight - 20,

  wallBuffer: 40,
  bodyBuffer: 10,

  dur: 100,
  maxSpeed: 10,

  minR: 10,
  maxR: 50,

  maxSpikes: 12,
  spikeW: 0.02,

  startFactor: 1,
  deathFactor: 0.25,
  spawnFactor: 1.5,

  fixedCost: 6,
  pixelCost: 0.002,
  spikeCost: 0.5,

  damageFactor: 80,

  moteSpawnRate: 0.1,

  color: '#34A853',
  quantity: 35
};

var state = {
  count: 0
};
