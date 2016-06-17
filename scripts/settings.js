// Config settings, and a global state object

var config = {
  w: window.innerWidth - 20,
  h: window.innerHeight - 20,

  wallBuffer: 40,
  bodyBuffer: 10,

  dur: 100,
  maxSpeed: 15,

  minR: 5,
  maxR: 50,

  maxSpikes: 8,
  spikeW: 0.025,

  color: '#34A853',
  quantity: 15
};

var state = {
  count: 0
};
