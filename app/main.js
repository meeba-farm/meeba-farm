import * as settings from './settings.js';
import {
  createView,
  getFrameRenderer,
} from './view.js';
import {
  separateBodies,
  simulateFrame,
} from './simulation.js';
import {
  getRandomBody,
} from './meebas/bodies.js';
import {
  range,
} from './utils/arrays.js';

const { width, height } = settings.tank;

const view = createView(width, height);
const renderFrame = getFrameRenderer(view);

/** @type {Object<string, any>} */
const anyWindow = window;
const MeebaFarm = {};
anyWindow.MeebaFarm = MeebaFarm;

MeebaFarm.bodies = range(settings.simulation.bodies).map(getRandomBody);
separateBodies(MeebaFarm.bodies);

/** @param {number} lastTick */
const simulate = (lastTick) => {
  const thisTick = performance.now();
  MeebaFarm.bodies = simulateFrame(MeebaFarm.bodies, lastTick, thisTick);
  setTimeout(() => simulate(thisTick), 8);
};
const render = () => {
  renderFrame(MeebaFarm.bodies);
  requestAnimationFrame(render);
};

// eslint-disable-next-line no-console
console.log('Simulating with seed:', settings.seed);
simulate(performance.now());
requestAnimationFrame(render);
