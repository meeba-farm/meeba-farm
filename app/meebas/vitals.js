/**
 * The life-cycle properties of a meeba
 *
 * @typedef Vitals
 * @prop {number} calories - the current calories the meeba has
 * @prop {number} diesAt - the calories at which the meeba dies
 * @prop {number} spawnsAt - the calories at which the meeba spawns
 * @prop {boolean} isDead - whether or not the meeba is dead
 */

const CALORIES_DEATH = 0.5;
const CALORIES_SPAWN = 2;
const CALORIES_START = (CALORIES_DEATH + CALORIES_SPAWN) / 2;

/**
 * Creates a new vitals object based on a mass and optionally an explicit
 * starting calorie level
 *
 * @param {number} mass - the mass of the meeba
 * @returns {Vitals}
 */
export const initVitals = (mass) => {
  const calories = Math.floor(mass * CALORIES_START);
  const diesAt = Math.floor(mass * CALORIES_DEATH);
  const spawnsAt = Math.floor(mass * CALORIES_SPAWN);
  const isDead = calories < diesAt;

  return { calories, diesAt, spawnsAt, isDead };
};

/**
 * Explicitly set the calories on a meeba's vitals, setting isDead as needed
 *
 * @param {Vitals} vitals - the vitals to update
 * @param {number} calories - the new calorie level
 * @returns {Vitals}
 */
export const setCalories = (vitals, calories) => ({
  ...vitals,
  calories,
  isDead: calories < vitals.diesAt,
});

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
