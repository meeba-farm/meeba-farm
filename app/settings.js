import {
  getNested,
  setNested,
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
 * @prop {number} upkeepPerSpike
 * @prop {number} upkeepPerLength
 * @prop {number} baseUpkeepAdjustment
 * @prop {number} spikeUpkeepAdjustment
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

const EXTRA_BUFFER = 16;
export const TANK_PADDING = 5;
export const UI_WIDTH = 250;

/** @type Settings */
export const settings = {
  core: {
    height: window.innerHeight - 2 * TANK_PADDING - EXTRA_BUFFER,
    energy: 3500000,
    moteSpawnRate: 4,
    seed: Math.random().toString(36).slice(2),
    startingBodies: 75,
    temperature: 30,
    volatility: 100,
    width: window.innerWidth - UI_WIDTH - 2 * TANK_PADDING - EXTRA_BUFFER,
  },
  bodies: {
    minRadius: 10,
    moteColor: '#792',
    moteRadius: 8,
    moteCalorieAdjustment: 2,
    moteSpeedAdjustment: 0.03,
    spawningEnergyAdjustment: 0.75,
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
    maxBodies: 800,
    spikeHighlightTime: 167,
  },
  spikes: {
    baseSpikeDrain: 2500,
    drainLengthExponent: 1.2,
    spikeWidth: 6,
  },
  vitals: {
    massCalorieExponent: 0.66, // Idealized Kleiber's law
    percentDiesAt: 0.5,
    percentSpawnsAt: 2,
    upkeepPerSpike: 8,
    upkeepPerLength: 1,
    baseUpkeepAdjustment: 0.075, // Adjust so "average" use is ~15 cal/sec
    spikeUpkeepAdjustment: 200, // Adjust so cost of four is about equal to mass cost
  },
};

/** @type Array<function(): void> */
const updateListeners = [];

/**
 * @param {string} pathString - dot-separated setting path
 * @returns {string[]} - path array
 */
const parsePathString = (pathString) => {
  const pathArray = pathString.split('.');
  return pathArray.length > 1 ? pathArray : ['core', ...pathArray];
};

/**
 * Updates a particular setting with a primitive value, updates a core value if
 * passed a single key rather than a full path
 *
 * @param {string} pathString - dot-separated setting path
 * @param {string|number|boolean} value - the new setting value
 */
export const updateSetting = (pathString, value) => {
  const path = parsePathString(pathString);

  setNested(settings, path, value);

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
