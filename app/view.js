import { PI_2 } from './utils/math.js';

/**
 * @typedef Circle
 * @prop {number} x - horizontal location on the pixel grid
 * @prop {number} y - vertical location on the pixel grid
 * @prop {number} radius - radius in pixels
 * @prop {string} fill - a valid color string
 */

const VIEW_ID = 'view';

/**
 * Creates a canvas of specified dimensions and appends it to the DOM
 *
 * @param {number} width - width in pixels
 * @param {number} height - height in pixels
 * @returns {HTMLCanvasElement}
 */
export const createView = (width, height) => {
  const view = document.createElement('canvas');
  view.setAttribute('id', VIEW_ID);
  view.setAttribute('width', width);
  view.setAttribute('height', height);

  document.getElementById('app').appendChild(view);
  return view;
};

/**
 * Returns a function which clears an entire canvas, must specify width/height
 *
 * @param {HTMLCanvasElement} view - the canvas to clear; mutated!
 * @param {number} width - its width
 * @param {number} height - its height
 * @returns {function(): void} - clears canvas when called
 */
export const viewClearer = (view, width, height) => () => {
  const ctx = view.getContext('2d');
  ctx.clearRect(0, 0, width, height);
};

/**
 * Takes a canvas view and returns a function to draw circles on it
 *
 * @param {HTMLCanvasElement} view - the canvas to draw on; mutated!
 * @returns {function(Circle): void} - takes a circle and draws it on the canvas
 */
export const getCircleDrawer = (view) => ({ x, y, radius, fill }) => {
  const ctx = view.getContext('2d');

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, PI_2);
  ctx.fillStyle = fill;
  ctx.fill();
};
