import {
  roundRange,
} from './math.js';
import {
  hasProp,
} from './objects.js';

/**
 * @typedef HSL
 *
 * @prop {number} h - hue in degrees (0 - 360)
 * @prop {number} s - saturation in percent (0 - 100)
 * @prop {number} l - lightness in percent (0 - 100)
 * @prop {number} [a] - alpha as percentage (0.0 - 1.0)
 */

/**
 * Normalizes a number by wrapping it to some size
 *
 * @param {number} num
 * @param {number} size
 * @returns {number}
 */
const wrapNumber = (num, size) => {
  const wrapped = num % size;
  return wrapped >= 0 ? wrapped : size + wrapped;
};

/**
 * Converts an hsl object to a CSS color string
 *
 * @param {HSL} hsl
 * @returns {string}
 */
export const hslToString = (hsl) => {
  const h = wrapNumber(hsl.h, 360);
  const s = roundRange(hsl.s, 0, 100);
  const l = roundRange(hsl.l, 0, 100);

  if (hasProp(hsl, 'a')) {
    const a = roundRange(hsl.a, 0, 1);
    return `hsla(${h},${s}%,${l}%,${a})`;
  }

  return `hsl(${h},${s}%,${l}%)`;
};
