import { settings } from '../settings.js';

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

const CALORIES_DEATH = 0.5;
const CALORIES_SPAWN = 2;
const CALORIES_START = (CALORIES_DEATH + CALORIES_SPAWN) / 2;

const MASS_CALORIE_QUOTIENT = 0.66; // Idealized Kleiber's law
const BASE_SPIKE_UPKEEP = 8;
const SPIKE_LENGTH_UPKEEP = 1;
const SPIKE_ADJUSTMENT = 200; // Adjust so cost of four is about equal to mass cost
const TEMPERATURE_ADJUSTMENT = Math.max(0, settings.core.temperature) / 30;
const UPKEEP_ADJUST = TEMPERATURE_ADJUSTMENT * 0.075; // Adjust so "average" use is ~15 cal/sec

/**
 * @param {Spike[]} spikes
 * @returns {number}
 */
const calcSpikeUpkeep = spikes => spikes
  .map(({ length }) => BASE_SPIKE_UPKEEP + length * SPIKE_LENGTH_UPKEEP)
  .reduce((total, perSpike) => total + perSpike, 0);

/**
 * @param {number} mass
 * @param {Spike[]} spikes
 * @returns {number}
 */
const calcUpkeep = (mass, spikes) => {
  const massCost = mass ** MASS_CALORIE_QUOTIENT;
  const spikeCost = calcSpikeUpkeep(spikes) / massCost * SPIKE_ADJUSTMENT;
  return Math.floor((massCost + spikeCost) * UPKEEP_ADJUST);
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
  const calories = Math.floor(mass * CALORIES_START);
  const diesAt = Math.floor(mass * CALORIES_DEATH);

  return {
    calories,
    upkeep: calcUpkeep(mass, spikes),
    diesAt,
    spawnsAt: Math.floor(mass * CALORIES_SPAWN),
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
