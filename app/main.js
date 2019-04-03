import {
  settings,
  updateSetting,
  addUpdateListener,
} from './settings.js';
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
import {
  seedPrng,
} from './utils/math.js';
import {
  createView,
  getFrameRenderer,
} from './view/animation.js';

/**
 * @typedef {import('./simulation.js').Body} Body
 */

const { core } = settings;

const view = createView(core.width, core.height);
const renderFrame = getFrameRenderer(view);

let oldWidth = core.width;
let oldHeight = core.height;
addUpdateListener(() => {
  const { width, height } = core;
  if (width !== oldWidth || height !== oldHeight) {
    view.width = width;
    view.height = height;
    oldWidth = width;
    oldHeight = height;
  }
});

/** @type {Object<string, any>} */
const anyWindow = window;
const MeebaFarm = {};
anyWindow.MeebaFarm = MeebaFarm;

/** @type {Body[]} */
MeebaFarm.bodies = [];
let isRunning = false;

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

MeebaFarm.reset = () => {
  // eslint-disable-next-line no-console
  console.log('Starting simulation with seed:', core.seed);
  seedPrng(core.seed);
  MeebaFarm.bodies = range(core.startingBodies).map(getRandomBody);
  separateBodies(MeebaFarm.bodies);
};

MeebaFarm.reset();
MeebaFarm.resume();
