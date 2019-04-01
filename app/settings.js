import { setNested } from './utils/objects.js';

/**
 * Core setting which are visible to and updatable by the GUI
 *
 * @typedef CoreSettings
 * @prop {number} energy
 * @prop {number} height
 * @prop {number} moteSpawnRate
 * @prop {string} seed
 * @prop {number} startingBodies
 * @prop {number} temperature
 * @prop {number} width
 */

/**
 * The settings object used by all modules
 *
 * @typedef Settings
 * @prop {CoreSettings} core
 */

const TANK_BUFFER = 20;

/** @type Settings */
export const settings = {
  core: {
    height: window.innerHeight - TANK_BUFFER,
    energy: 3500000,
    moteSpawnRate: 4,
    seed: Math.random().toString(36).slice(2),
    startingBodies: 75,
    temperature: 30,
    width: window.innerWidth - TANK_BUFFER,
  },
};

/** @type Array<function(): void> */
const updateListeners = [];

/**
 * Updates a particular setting with a primitive value, updates a core value if
 * passed a single key rather than a full path
 *
 * @param {string} pathString - dot-separated setting path
 * @param {string|number|boolean} value - the new setting value
 */
export const updateSetting = (pathString, value) => {
  const pathArray = pathString.split('.');
  const fullPath = pathArray.length > 1 ? pathArray : ['core', ...pathArray];

  setNested(settings, fullPath, value);

  for (const onUpdate of updateListeners) {
    onUpdate();
  }
};

/**
 * Takes a setting function which will be called immediately, and then again
 * every time the settings object is updated
 *
 * @param {function(): void} onUpdate - a function to run on updates
 */
export const addUpdateListener = (onUpdate) => {
  onUpdate();
  updateListeners.push(onUpdate);
};
