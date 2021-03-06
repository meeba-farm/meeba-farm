import { range } from './arrays.js';

export const PI_2 = 2 * Math.PI;

// Cached lookup tables of expensive trig functions
const LUT_RES = 1024;
const HALF_LUT_RES = LUT_RES / 2;
const LOOKUP_TABLES = {
  SIN: range(LUT_RES).map(i => Math.sin(PI_2 * i / LUT_RES)),
  COS: range(LUT_RES).map(i => Math.cos(PI_2 * i / LUT_RES)),
  ASIN: range(LUT_RES + 1).map(i => Math.asin((i - HALF_LUT_RES) / HALF_LUT_RES)),
  ACOS: range(LUT_RES + 1).map(i => Math.acos((i - HALF_LUT_RES) / HALF_LUT_RES)),
};

/**
 * Convenience function to square a number
 *
 * @param {number} n
 * @returns {number}
 */
export const sqr = n => n * n;

/**
 * @param {function(number[]): number} fn
 * @returns {function(number[]): number}
 */
const nanEmpties = (fn) => (nums) => (nums.length === 0 ? NaN : fn(nums));

/**
 * Returns the sum of an array of numbers
 *
 * @param {number[]} nums
 * @returns {number}
 */
export const sum = nanEmpties(nums => nums.reduce((s, n) => s + n));

/**
 * Returns the least in an array of numbers
 *
 * @param {number[]} nums
 * @returns {number}
 */
export const minimum = nanEmpties(nums => nums.reduce((min, n) => (min < n ? min : n)));

/**
 * Returns the most in an array of numbers
 *
 * @param {number[]} nums
 * @returns {number}
 */
export const maximum = nanEmpties(nums => nums.reduce((max, n) => (max > n ? max : n)));

/**
 * Returns the average of an array of numbers
 *
 * @param {number[]} nums
 * @returns {number}
 */
export const mean = nums => sum(nums) / nums.length;

/**
 * Returns the middle value in an array of numbers
 *
 * @param {number[]} nums
 * @returns {number}
 */
export const mode = nanEmpties(
  nums => nums.slice().sort((a, b) => a - b)[Math.floor((nums.length - 1) / 2)],
);

/**
 * Returns the sum of the products of two sets of numbers
 *
 * @param {number[]} set1
 * @param {number[]} set2
 * @returns {number}
 */
export const dotProduct = (set1, set2) => {
  const products = set1.map((n1, i) => n1 * set2[i]);
  return sum(products);
};

/**
 * Rounds a number to be no less or more than a min and max
 *
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const roundRange = (num, min, max) => {
  if (num < min) {
    return min;
  }

  if (num > max) {
    return max;
  }

  return num;
};

/**
 * Normalize a number to be a percentage between a certain min and max
 *
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @returns {number} - percentage from 0.0 to 1.0
 */
export const normalize = (num, min, max) => (roundRange(num, min, max) - min) / (max - min);


/**
 * Normalize an angle in turns, rounding it to be between 0 and 1
 *
 * 1 turn = 360°, 2π, one full rotation; 1.5 turns = 180°, 1π, 0.5 turns
 *
 * @param {number} turns - a floating point count of rotations
 * @returns {number} - the same angle normalized between 0 and 1
 */
export const roundAngle = (turns) => {
  if (turns >= 1) {
    return turns % 1;
  }
  if (turns < 0) {
    return turns + Math.ceil(Math.abs(turns));
  }
  return turns;
};

/**
 * Returns the size of the gap between two angles in turns
 *
 * @param {number} angle1
 * @param {number} angle2
 * @returns {number} - the difference between the two angles
 */
export const getGap = (angle1, angle2) => {
  const gap = Math.abs(roundAngle(angle1) - roundAngle(angle2));
  return gap <= 0.5 ? gap : 1 - gap;
};

/**
 * Creates a trig function based on a lookup table, accepting an angle in "turns"
 *
 * @param {number[]} lut - A lookup table for a particular trig function
 * @returns {function(number): number} - the trig function
 */
const getTrigFn = (lut) => (turns) => lut[Math.floor(roundAngle(turns) * LUT_RES)];

/**
 * Efficiently gets the sine for an angle in turns
 *
 * @param {number} turns
 * @returns {number}
 */
export const sin = getTrigFn(LOOKUP_TABLES.SIN);

/**
 * Efficiently gets the cosine for an angle in turns
 *
 * @param {number} turns
 * @returns {number}
 */
export const cos = getTrigFn(LOOKUP_TABLES.COS);


/**
 * Creates an inverse trig function based on a lookup table, returning an angle in "turns"
 *
 * @param {number[]} lut - A lookup table for a particular trig function
 * @returns {function(number): number} - the inverse trig function
 */
const getInverseTrigFn = (lut) => (ratio) => {
  const index = Math.floor(ratio * HALF_LUT_RES + HALF_LUT_RES);
  return lut[index] / PI_2;
};

/**
 * Efficiently gets the arcsine for a trigonometric ratio
 *
 * @param {number} ratio - trigonometric ratio between -1 and 1
 * @returns {number} - angle in turns
 */
export const asin = getInverseTrigFn(LOOKUP_TABLES.ASIN);

/**
 * Efficiently gets the arccosine for a trigonometric ratio
 *
 * @param {number} ratio - trigonometric ratio between -1 and 1
 * @returns {number} - angle in turns
 */
export const acos = getInverseTrigFn(LOOKUP_TABLES.ACOS);

/**
 * A simple pseudo-random number generator which takes a base36 seed
 * Based on this github gist by @blixt:
 * gist.github.com/blixt/f17b47c62508be59987b
 *
 * @param {string} alphaNumSeed - a base36 string, i.e. [0-9a-z]
 * @returns {function(): number} - a pseudo-random number generation function
 */
const getPrng = (alphaNumSeed) => {
  let seed = parseInt(alphaNumSeed, 36);
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483646;
  };
};

let prng = () => 0;

/**
 * Seeds the PRNG, which will allow rand and randInt to begin functioning
 *
 * @param {string} seed - any string, will be converted to base36
 */
export const seedPrng = (seed) => {
  const alphaNumSeed = seed.toLowerCase().replace(/[^0-9a-z]/, '');
  prng = getPrng(alphaNumSeed);
};

/**
 * Gets a random floating point number between 0 and 1,
 * must be seeded or will always return 0
 *
 * @returns {number}
 */
export const rand = () => prng();

/**
 * Gets a random integer between a specified min and max (non-inclusive),
 * must be seeded or will always return min
 *
 * @param {number} min - the minimum random number (inclusive)
 * @param {number} max - the maximum random number (non-inclusive)
 * @returns {number}
 */
export const randInt = (min, max) => min + Math.floor(prng() * (max - min));
