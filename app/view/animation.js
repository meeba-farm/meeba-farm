import {
  flatten,
  groupBy,
} from '../utils/arrays.js';
import { PI_2 } from '../utils/math.js';

/**
 * @typedef {import('../simulation.js').Body} Body
 */

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

/**
 * @typedef Drawable
 * @prop {string} fill - a color to fill the drawable
 */

/**
 * Gets a function to draw the outline of a circle
 *
 * @param {CanvasRenderingContext2D} ctx - 2d canvas context to draw with; mutated!
 * @returns {function(Circle): void} - takes a circle and outlines its path
 */
const getCircleOutliner = (ctx) => ({ x, y, radius }) => {
  ctx.moveTo(x + radius, y);
  ctx.arc(x, y, radius, 0, PI_2);
};

/**
 * Gets a function to draw the outline of a triangle
 *
 * @param {CanvasRenderingContext2D} ctx - 2d canvas context to draw with; mutated!
 * @returns {function(Triangle): void} - takes a triangle and outlines its path
 */
const getTriangleOutliner = (ctx) => ({ x1, y1, x2, y2, x3, y3 }) => {
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x1, y1);
};

/**
 * Get a drawable's fill
 *
 * @param {Drawable} drawable
 * @returns {string}
 */
const getFill = drawable => drawable.fill;

/**
 * Gets a function to outline and fill drawable objects, will iterate through
 * the drawables by fill color, outlining them all before filling once
 *
 * @param {CanvasRenderingContext2D} ctx - 2d canvas context to draw with; mutated!
 * @returns {function(any[], function(any): void): void} - (no way to spec this without generics)
 */
const getOutlineFiller = (ctx) => (drawables, outlineFn) => {
  const byFill = groupBy(drawables, getFill);

  for (const [fill, fillDrawables] of Object.entries(byFill)) {
    ctx.beginPath();

    for (const drawable of fillDrawables) {
      outlineFn(drawable);
    }

    ctx.fillStyle = fill;
    ctx.fill();
  }
};

/**
 * Takes a canvas element and returns a function which takes
 * an array of bodies and renders them
 *
 * @param {HTMLCanvasElement} view - the canvas to draw on; mutated!
 * @returns {function(Body[]): void} - renders bodies
 */
export const getFrameRenderer = (view) => (bodies) => {
  const ctx = view.getContext('2d');
  if (!ctx) {
    throw new Error(`Unable to get 2d context for view: ${view}`);
  }

  const spikes = flatten(bodies.map(body => body.spikes));
  const fillOutlines = getOutlineFiller(ctx);
  ctx.clearRect(0, 0, view.width, view.height);

  fillOutlines(spikes, getTriangleOutliner(ctx));
  fillOutlines(bodies, getCircleOutliner(ctx));
};
