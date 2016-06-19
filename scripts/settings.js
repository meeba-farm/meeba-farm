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

  startFactor: 1.5,
  deathFactor: 0.5,
  spawnFactor: 2,

  fixedCost: 6,
  pixelCost: 0.002,
  spikeCost: 0.5,
  spawnCost: 0,

  damageFactor: 80,

  moteSpawnRate: 0.1,
  mutateRate: 0.25,
  mutateSpread: 0.5,
  mutateProportion: 10,

  minTraits: 20,
  maxTraits: 400,
  startMin: 0, 
  startMax: 50,
  traitChances: {
    size: 0.95,
    spike: 0.05
  },

  color: '#34A853',
  quantity: 25
};

var state = {
  count: 0
};
