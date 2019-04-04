import {
  settings,
  addUpdateListener,
} from '../settings.js';

/**
 * @typedef {import('./spikes.js').Spike} Spike
 */

/**
 * The life-cycle properties of a meeba
 *
 * @typedef Vitals
 * @prop {number} calories - the current calories the meeba has
 * @prop {number} upkeep - how many calories per second the meeba uses
 * @prop {number} diesAt - the calories at which the meeba dies
 * @prop {number} spawnsAt - the calories at which the meeba spawns
 * @prop {boolean} isDead - whether or not the meeba is dead
 */

/**
 * Dynamically calculated spike settings
 *
 * @typedef DynamicSpikeSettings
 * @prop {number} percentStartsAt
 * @prop {number} upkeepAdjustment
 */

const { core, vitals: fixed } = settings;
const dynamic = /** @type {DynamicSpikeSettings} */ ({});
addUpdateListener(() => {
  const temperatureAdjustment = Math.max(0, core.temperature) / 30;
  dynamic.percentStartsAt = (fixed.percentDiesAt + fixed.percentSpawnsAt) / 2;
  dynamic.upkeepAdjustment = fixed.baseUpkeepAdjustment * temperatureAdjustment;
});

/**
 * @param {Spike[]} spikes
 * @returns {number}
 */
const calcSpikeUpkeep = spikes => spikes
  .map(({ length }) => fixed.upkeepPerSpike + length * fixed.upkeepPerLength)
  .reduce((total, perSpike) => total + perSpike, 0);

/**
 * @param {number} mass
 * @param {Spike[]} spikes
 * @returns {number}
 */
const calcUpkeep = (mass, spikes) => {
  const massCost = mass ** fixed.massCalorieExponent;
  const spikeCost = calcSpikeUpkeep(spikes) / massCost * fixed.spikeUpkeepAdjustment;
  return Math.floor((massCost + spikeCost) * dynamic.upkeepAdjustment);
};

/**
 * Creates a new vitals object based on a mass and optionally an explicit
 * starting calorie level
 *
 * @param {number} mass - the mass of the meeba
 * @param {Spike[]} spikes - the spikes of the meeba
 * @returns {Vitals}
 */
export const initVitals = (mass, spikes) => {
  const calories = Math.floor(mass * dynamic.percentStartsAt);
  const diesAt = Math.floor(mass * fixed.percentDiesAt);

  return {
    calories,
    upkeep: calcUpkeep(mass, spikes),
    diesAt,
    spawnsAt: Math.floor(mass * fixed.percentSpawnsAt),
    isDead: calories < diesAt,
  };
};

/**
 * Explicitly set the calories on a meeba's vitals, setting isDead as needed
 *
 * @param {Vitals} vitals - the vitals to update; mutated!
 * @param {number} calories - the new calorie level
 */
export const setCalories = (vitals, calories) => {
  vitals.calories = calories;
  vitals.isDead = calories < vitals.diesAt;
};

/**
 * Removes calories from the meeba, setting isDead as needed. Returns the
 * actual calories drained, which may be less than the intended amount
 *
 * @param {Vitals} vitals - the vitals of the meeba to drain calories from; mutated!
 * @param {number} drain - the amount to drain
 * @returns {number} - the actual amount drained
 */
export const drainCalories = (vitals, drain) => {
  const actualDrain = vitals.calories > drain ? drain : vitals.calories;
  vitals.calories -= actualDrain;

  if (vitals.calories < vitals.diesAt) {
    vitals.isDead = true;
  }

  return actualDrain;
};
