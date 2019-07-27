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
  spawnMote,
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
  sqr,
} from './utils/math.js';
import {
  easeIn,
  easeOut,
  getInterval,
  getTimeout,
  getTweener,
} from './utils/tweens.js';
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

/**
 * @typedef {import('./utils/tweens.js').Tweener} Tweener
 */

const APP_ID = 'app';
const VIEW_ID = 'view';
const { core, bodies, simulation, startup } = settings;

const view = canvas(VIEW_ID, core.width, core.height);
const renderFrame = getFrameRenderer(view);

let oldWidth = core.width;
let oldHeight = core.height;

/** @type {number} */
let startupMoteCount;

addUpdateListener(() => {
  const { width, height } = core;
  if (width !== oldWidth || height !== oldHeight) {
    view.width = width;
    view.height = height;
    oldWidth = width;
    oldHeight = height;
  }

  const moteCalories = Math.PI * sqr(bodies.moteRadius) * bodies.moteCalorieAdjustment;
  startupMoteCount = Math.floor(width * height * startup.moteCalorieDensity / moteCalories);
});

/** @type {Object<string, any>} */
const anyWindow = window;
const MeebaFarm = {};
anyWindow.MeebaFarm = MeebaFarm;

/** @type {Body[]} */
MeebaFarm.bodies = [];

// ------ Setup Loop ------
/** @type {Tweener[]} */
let tweens = [];

/** @type {Snapshot[]} */
let snapshots = [];

/** @type {Tweener|null} */
let snapshotAtInterval = null;

const { start, stop, reset } = createLoop((tick, delay) => {
  MeebaFarm.bodies = simulateFrame(MeebaFarm.bodies, tick, delay);
  renderFrame(MeebaFarm.bodies);

  // Run tweens, discarding those which are complete
  tweens = tweens.filter(tween => tween(tick));

  if (snapshotAtInterval) {
    snapshotAtInterval(tick);
  }
});

// ------ Setup Debug API ------
MeebaFarm.pause = stop;
MeebaFarm.resume = start;
MeebaFarm.reset = () => {
  // eslint-disable-next-line no-console
  console.log('Starting simulation with seed:', core.seed);
  seedPrng(core.seed);

  const { meebaSpawnDelay, meebaSpawnDuration, moteSpawnDelay, moteFadeInTime } = startup;
  const meebaTotalDelay = meebaSpawnDelay + moteSpawnDelay + moteFadeInTime;

  const motes = range(startupMoteCount).map(spawnMote);
  motes.forEach(({ fill }) => { fill.a = 0; });
  const moteTweens = motes.map(({ fill }) => (
    getTweener(fill)
      .addFrame(moteSpawnDelay, {})
      .addFrame(moteFadeInTime, { a: 1 }, easeIn)
      .start()
  ));

  const { moteSpawnRate } = core;
  core.moteSpawnRate = 0;
  const spawnRateReset = getTimeout(() => {
    core.moteSpawnRate = moteSpawnRate;
  }, meebaTotalDelay);

  const meebas = range(core.startingMeebaCount).map(getRandomBody);
  meebas.forEach((meeba) => {
    meeba.fill.a = 0;
    meeba.spikes.forEach(({ fill }) => { fill.a = 0; });
  });
  const meebaTweens = meebas.map((meeba, i) => {
    const delay = meebaTotalDelay + meebaSpawnDuration * easeOut(i / meebas.length);

    return getTweener(meeba)
      .addFrame(delay, {})
      .addFrame(0, (/** @type {number} */delta) => {
        if (delta === 1) {
          MeebaFarm.bodies.push(meeba);
        }
      })
      .addFrame(simulation.bodySpawnInactiveTime, {
        fill: { a: 1 },
        spikes: meeba.spikes.map(() => ({ fill: { a: 1 } })),
      }, easeOut)
      .start();
  });

  MeebaFarm.bodies = motes;
  tweens = [...moteTweens, ...meebaTweens, spawnRateReset];

  reset();
};

MeebaFarm.updateSetting = updateSetting;
MeebaFarm.getSetting = getSetting;
MeebaFarm.getSavedSettings = getSavedSettings;
MeebaFarm.loadSettings = loadSettings;
MeebaFarm.restoreDefaultSettings = restoreDefaultSettings;

MeebaFarm.snapshots = {
  start(frequency = 5000) {
    snapshotAtInterval = getInterval((tick) => {
      snapshots.push(getSnapshot(tick, MeebaFarm.bodies));
    }, frequency);
  },

  stop() {
    snapshotAtInterval = null;
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
