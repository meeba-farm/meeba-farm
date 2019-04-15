import {
  getNested,
  setNested,
  listKeys,
  listValues,
} from './utils/objects.js';

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
 * @prop {number} volatility
 * @prop {number} width
 */

/**
 * @typedef BodiesModuleSettings
 * @prop {number} initialEnergyAdjustment
 * @prop {number} minRadius
 * @prop {string} moteColor
 * @prop {number} moteRadius
 * @prop {number} moteCalorieAdjustment
 * @prop {number} moteSpeedAdjustment
 * @prop {number} spawningEnergyAdjustment
 */

/**
 * @typedef GenomeModuleSettings
 * @prop {number} averageGeneCount
 * @prop {number} averageGeneSize
 * @prop {number} baseChanceMutateBit
 * @prop {number} baseChanceDropByte
 * @prop {number} baseChanceRepeatByte
 * @prop {number} baseChanceTransposeByte
 * @prop {number} baseChanceDropGene
 * @prop {number} baseChanceRepeatGene
 * @prop {number} baseChanceTransposeGene
 * @prop {number} bitsPerMass
 * @prop {number} bitsPerSpikeLength
 * @prop {number} percentSizeGenes
 * @prop {number} percentSpikeGenes
 */

/**
 * @typedef SimulationModuleSettings
 * @prop {number} maxBodies
 * @prop {number} spikeHighlightTime
 */

/**
 * @typedef SpikesModuleSettings
 * @prop {number} baseSpikeDrain
 * @prop {number} drainLengthExponent
 * @prop {number} spikeWidth
 */

/**
 * @typedef VitalsModuleSettings
 * @prop {number} massCalorieExponent
 * @prop {number} percentDiesAt
 * @prop {number} percentSpawnsAt
 * @prop {number} baseUpkeepAdjustment
 * @prop {number} upkeepPerSpike
 * @prop {number} upkeepPerMass
 * @prop {number} upkeepPerLength
 */

/**
 * The settings object used by all modules
 *
 * @typedef Settings
 * @prop {CoreSettings} core
 * @prop {BodiesModuleSettings} bodies
 * @prop {GenomeModuleSettings} genome
 * @prop {SimulationModuleSettings} simulation
 * @prop {SpikesModuleSettings} spikes
 * @prop {VitalsModuleSettings} vitals
 */

const STORAGE_KEY = 'meeba-farm.settings';
const EXTRA_BUFFER = 16;
export const TANK_PADDING = 5;
export const UI_WIDTH = 250;

/**
 * @returns {string}
 */
const getRandomSeed = () => Math.random().toString(36).slice(2);

/**
 * @returns {number}
 */
const getTankWidth = () => window.innerWidth - UI_WIDTH - 2 * TANK_PADDING - EXTRA_BUFFER;

/**
 * @returns {number}
 */
const getTankHeight = () => window.innerHeight - 2 * TANK_PADDING - EXTRA_BUFFER;

/** @type Settings */
export const settings = {
  core: {
    height: getTankHeight(),
    energy: 5000,
    moteSpawnRate: 16,
    seed: getRandomSeed(),
    startingBodies: 50,
    temperature: 30,
    volatility: 100,
    width: getTankWidth(),
  },
  bodies: {
    initialEnergyAdjustment: 10,
    minRadius: 10,
    moteColor: '#792',
    moteRadius: 5,
    moteCalorieAdjustment: 2,
    moteSpeedAdjustment: 0.2,
    spawningEnergyAdjustment: 20,
  },
  genome: {
    averageGeneCount: 48,
    averageGeneSize: 6,
    baseChanceMutateBit: 0.0005,
    baseChanceDropByte: 0.008,
    baseChanceRepeatByte: 0.008,
    baseChanceTransposeByte: 0.016,
    baseChanceDropGene: 0.03,
    baseChanceRepeatGene: 0.03,
    baseChanceTransposeGene: 0.06,
    bitsPerMass: 1,
    bitsPerSpikeLength: 2,
    percentSizeGenes: 0.95,
    percentSpikeGenes: 0.05,
  },
  simulation: {
    maxBodies: 500,
    spikeHighlightTime: 167,
  },
  spikes: {
    baseSpikeDrain: 10000,
    drainLengthExponent: 1.2,
    spikeWidth: 6,
  },
  vitals: {
    massCalorieExponent: 0.66, // Idealized Kleiber's law
    percentDiesAt: 0.5,
    percentSpawnsAt: 2,
    baseUpkeepAdjustment: 1,
    upkeepPerLength: 8,
    upkeepPerMass: 1,
    upkeepPerSpike: 128,
  },
};

const SETTINGS_KEYS = listKeys(settings);
const DEFAULT_VALUES = listValues(settings);

const storeSettings = () => {
  const settingsString = window.btoa(JSON.stringify(listValues(settings)));
  window.localStorage.setItem(STORAGE_KEY, settingsString);
};

/** @type Array<function(): void> */
const updateListeners = [];
const triggerListeners = () => {
  for (const onUpdate of updateListeners) {
    onUpdate();
  }
};

/**
 * @param {string} pathString - dot-separated setting path
 * @returns {string[]} - path array
 */
const parsePathString = (pathString) => {
  const pathArray = pathString.split('.');
  return pathArray.length > 1 ? pathArray : ['core', ...pathArray];
};

/**
 * @param {string} pathString - dot-separated setting path
 * @param {string|number|boolean} value
 */
const setSetting = (pathString, value) => {
  const path = parsePathString(pathString);
  setNested(settings, path, value);
};

/**
 * Updates a particular setting with a primitive value, updates a core value if
 * passed a single key rather than a full path
 *
 * @param {string} pathString - dot-separated setting path
 * @param {string|number|boolean} value - the new setting value
 */
export const updateSetting = (pathString, value) => {
  setSetting(pathString, value);
  storeSettings();
  triggerListeners();
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

/**
 * Gets a setting value by its dot-separated path string
 *
 * @param {string} pathString - dot-separated setting path
 * @returns {string|number|boolean}
 */
export const getSetting = (pathString) => {
  const path = parsePathString(pathString);
  return getNested(settings, path);
};

/**
 * Takes string of settings values and updates all settings to match
 *
 * @param {string} settingsString - base64 encoded JSON array
 */
export const loadSettings = (settingsString) => {
  let values = /** @type {(string|number|boolean)[]} */([]);
  try {
    values = JSON.parse(window.atob(settingsString));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Unable to load settings: ${err}`);
  }

  if (values.length === SETTINGS_KEYS.length) {
    SETTINGS_KEYS.forEach((key, i) => setSetting(key, values[i]));
    triggerListeners();
  }
};

/**
 * Returns the currently saved settings string
 *
 * @returns {string|null} - base64 encoded JSON array of settings values
 */
export const getSavedSettings = () => window.localStorage.getItem(STORAGE_KEY);

/**
 * Clears out all saved settings and restores the defaults
 */
export const restoreDefaultSettings = () => {
  window.localStorage.removeItem(STORAGE_KEY);
  SETTINGS_KEYS.forEach((key, i) => setSetting(key, DEFAULT_VALUES[i]));
  setSetting('seed', getRandomSeed());
  setSetting('width', getTankWidth());
  setSetting('height', getTankHeight());
  triggerListeners();
};

// Load settings from local storage if any, otherwise save defaults
const previousSettings = getSavedSettings();
if (previousSettings) {
  loadSettings(previousSettings);
} else {
  storeSettings();
}
