import { e } from './dom.js';

/**
 * Returns a new canvas element
 *
 * @param {string} id
 * @param {number} width
 * @param {number} height
 * @returns {HTMLCanvasElement}
 */
export const canvas = (id, width, height) => e('canvas', { id, width, height });
