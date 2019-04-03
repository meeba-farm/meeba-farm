import { e } from './dom.js';

/**
 * Returns a basic button element with an onclick listener
 *
 * @param {string} label
 * @param {function([Event]): void} onclick
 * @returns {HTMLButtonElement}
 */
export const button = (label, onclick = () => {}) => e('button', {
  onclick,
  style: {
    'margin-right': '0.5em',
  },
}, label);

/**
 * Returns a new canvas element
 *
 * @param {string} id
 * @param {number} width
 * @param {number} height
 * @returns {HTMLCanvasElement}
 */
export const canvas = (id, width, height) => e('canvas', { id, width, height });
