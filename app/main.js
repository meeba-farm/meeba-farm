import {
  settings,
  updateSetting,
} from './settings.js';
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

const { width, height, startingBodies } = settings.core;

const view = createView(width, height);
const renderFrame = getFrameRenderer(view);

/** @type {Object<string, any>} */
const anyWindow = window;
const MeebaFarm = {};
anyWindow.MeebaFarm = MeebaFarm;

MeebaFarm.bodies = range(startingBodies).map(getRandomBody);
separateBodies(MeebaFarm.bodies);

/** @type {boolean} */
let isRunning;

/** @param {number} lastTick */
const simulate = (lastTick) => {
  if (isRunning) {
    const thisTick = performance.now();
    MeebaFarm.bodies = simulateFrame(MeebaFarm.bodies, lastTick, thisTick);
    setTimeout(() => simulate(thisTick), 8);
  }
};
const render = () => {
  if (isRunning) {
    renderFrame(MeebaFarm.bodies);
    requestAnimationFrame(render);
  }
};

MeebaFarm.updateSetting = updateSetting;

MeebaFarm.pause = () => {
  isRunning = false;
};

MeebaFarm.resume = () => {
  isRunning = true;
  simulate(performance.now());
  requestAnimationFrame(render);
};

// eslint-disable-next-line no-console
console.log('Simulating with seed:', settings.core.seed);
MeebaFarm.resume();
