import {
  TANK_PADDING,
  UI_WIDTH,
  settings,
  updateSetting,
  addUpdateListener,
  getSetting,
  getSavedSettings,
  loadSettings,
  restoreDefaultSettings,
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
  getFrameRenderer,
} from './view/animation.js';
import {
  canvas,
} from './view/components.js';
import {
  e,
  appendById,
} from './view/dom.js';
import {
  getInterface,
} from './view/interface.js';

/**
 * @typedef {import('./simulation.js').Body} Body
 */

const APP_ID = 'app';
const VIEW_ID = 'view';
const { core } = settings;

const view = canvas(VIEW_ID, core.width, core.height);
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
MeebaFarm.getSetting = getSetting;
MeebaFarm.getSavedSettings = getSavedSettings;
MeebaFarm.loadSettings = loadSettings;
MeebaFarm.restoreDefaultSettings = restoreDefaultSettings;

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

const frameElement = e(
  'div',
  { style: { width: `${UI_WIDTH + 2 * TANK_PADDING}px` } },
  e('div', {
    style: {
      float: 'left',
      width: `${UI_WIDTH}px`,
    },
  }, getInterface(MeebaFarm)),
  e('div', {
    style: {
      float: 'right',
      padding: `${TANK_PADDING}px`,
      width: '0px',
    },
  }, view),
);

appendById(APP_ID, frameElement);
MeebaFarm.reset();
MeebaFarm.resume();
