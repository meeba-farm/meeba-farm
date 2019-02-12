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
 * Sets the parameters of a vitals object to initial values
 *
 * @param {Vitals} vitals - the object to init; mutated!
 * @param {number} mass - the mass of the meeba
 * @param {number} [calories] - optional starting calorie value
 */
export const initVitals = (vitals, mass, calories) => {
  vitals.calories = calories !== undefined ? calories : Math.floor(mass * CALORIES_START);
  vitals.diesAt = Math.floor(mass * CALORIES_DEATH);
  vitals.spawnsAt = Math.floor(mass * CALORIES_SPAWN);

  vitals.isDead = vitals.calories < vitals.diesAt;
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
