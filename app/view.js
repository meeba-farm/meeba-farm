import { PI_2 } from './utils/math.js';

/**
 * @typedef Circle
 * @prop {number} x - horizontal location on the pixel grid
 * @prop {number} y - vertical location on the pixel grid
 * @prop {number} radius - radius in pixels
 * @prop {string} fill - a valid color string
 */

/**
 * @typedef Triangle
 * @prop {number} x1 - horizontal location of first point
 * @prop {number} y1 - vertical location of first point
 * @prop {number} x2 - second point
 * @prop {number} y2 - second point
 * @prop {number} x3 - third point
 * @prop {number} y3 - third point
 * @prop {string} fill - a valid color string
 */

const VIEW_ID = 'view';

/**
 * Guarantees a 2d context is not null by throwing if not found
 *
 * @param {HTMLCanvasElement} view - the canvas to get a context for
 * @returns {CanvasRenderingContext2D}
 */
const get2dContext = (view) => {
  const ctx = view.getContext('2d');
  if (!ctx) {
    throw new Error(`Unable to get 2d context for view: ${view}`);
  }
  return ctx;
};

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
  view.width = width;
  view.height = height;

  const app = document.getElementById('app');
  if (!app) {
    throw new Error('Unable to find #app element!');
  }
  app.appendChild(view);

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
export const getViewClearer = (view, width, height) => () => {
  const ctx = get2dContext(view);
  ctx.clearRect(0, 0, width, height);
};

/**
 * Takes a canvas view and returns a function to draw circles on it
 *
 * @param {HTMLCanvasElement} view - the canvas to draw on; mutated!
 * @returns {function(Circle): void} - takes a circle and draws it on the canvas
 */
export const getCircleDrawer = (view) => ({ x, y, radius, fill }) => {
  const ctx = get2dContext(view);

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, PI_2);
  ctx.fillStyle = fill;
  ctx.fill();
};

/**
 * Takes a canvas view and returns a function to draw triangle on it
 *
 * @param {HTMLCanvasElement} view - the canvas to draw on; mutated!
 * @returns {function(Triangle): void} - takes a triangle and draws it on the canvas
 */
export const getTriangleDrawer = (view) => ({ x1, y1, x2, y2, x3, y3, fill }) => {
  const ctx = get2dContext(view);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();

  ctx.fillStyle = fill;
  ctx.fill();
};
