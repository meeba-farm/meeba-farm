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
  simulateFrame,
} from './simulation.js';
import {
  getRandomBody,
} from './meebas/bodies.js';
import {
  range,
} from './utils/arrays.js';
import {
  getSnapshot,
  toCsv,
} from './utils/diagnostics.js';
import {
  createLoop,
} from './utils/loop.js';
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

/**
 * @typedef {import('./utils/diagnostics.js').Snapshot} Snapshot
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

// ------ Setup Loop ------
/** @type {Snapshot[]} */
let snapshots = [];
let nextSnapshot = Infinity;
let snapshotFrequency = 0;

const { start, stop, reset } = createLoop((tick, delay) => {
  MeebaFarm.bodies = simulateFrame(MeebaFarm.bodies, tick, delay);
  renderFrame(MeebaFarm.bodies);

  if (tick > nextSnapshot) {
    nextSnapshot = tick + snapshotFrequency;
    snapshots.push(getSnapshot(tick, MeebaFarm.bodies));
  }
});

// ------ Setup Debug API ------
MeebaFarm.pause = stop;
MeebaFarm.resume = start;
MeebaFarm.reset = () => {
  // eslint-disable-next-line no-console
  console.log('Starting simulation with seed:', core.seed);
  seedPrng(core.seed);
  MeebaFarm.bodies = range(core.startingMeebaCount).map(getRandomBody);
  reset();
};

MeebaFarm.updateSetting = updateSetting;
MeebaFarm.getSetting = getSetting;
MeebaFarm.getSavedSettings = getSavedSettings;
MeebaFarm.loadSettings = loadSettings;
MeebaFarm.restoreDefaultSettings = restoreDefaultSettings;

MeebaFarm.snapshots = {
  start(frequency = 5000) {
    nextSnapshot = 0;
    snapshotFrequency = frequency;
  },

  stop() {
    nextSnapshot = Infinity;
  },

  clear() {
    snapshots = [];
  },

  getCsv() {
    return toCsv(snapshots);
  },

  getRaw() {
    return snapshots;
  },

  now() {
    return getSnapshot(performance.now(), MeebaFarm.bodies);
  },
};


// ------ Setup UI ------
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

// ------ Run ------
MeebaFarm.reset();
MeebaFarm.resume();
