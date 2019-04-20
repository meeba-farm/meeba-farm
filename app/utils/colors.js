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
 * @typedef RGB
 *
 * @prop {number} r - red channel (0 - 255)
 * @prop {number} g - green (0 - 255)
 * @prop {number} b - blue (0 - 255)
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
  const l = roundRange(hsl.l, 0, 100);
  const s = (l === 0 || l === 100) ? 0 : roundRange(hsl.s, 0, 100);
  const h = s === 0 ? 0 : wrapNumber(hsl.h, 360);

  if (hasProp(hsl, 'a')) {
    const a = roundRange(hsl.a, 0, 1);
    return `hsla(${h},${s}%,${l}%,${a})`;
  }

  return `hsl(${h},${s}%,${l}%)`;
};

/**
 * Gets the hue value for an rgb object
 *
 * @param {RGB} rgb
 * @returns {number}
 */
export const rgbToHue = ({ r, g, b }) => {
  if (r === g && r === b) {
    return 0;
  }

  if (r >= g && r >= b) {
    const min = g > b ? b : g;
    const hue = Math.round((g - b) / (r - min) * 60);
    return wrapNumber(hue, 360);
  }

  if (g >= r && g >= b) {
    const min = r > b ? b : r;
    const hue = Math.round((b - r) / (g - min) * 60 + 120);
    return wrapNumber(hue, 360);
  }

  const min = r > g ? g : r;
  const hue = Math.round((r - g) / (b - min) * 60 + 240);
  return wrapNumber(hue, 360);
};
