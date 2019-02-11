import {
  cos,
  sin,
  asin,
} from '../utils/math.js';

/**
 * A spike/triangle attached to a body/circle
 *
 * @typedef Spike
 * @prop {string} fill - this color of the spike
 * @prop {number} length - the length of the spike
 * @prop {number} drain - how many calories drained per second
 * @prop {number} x1 - x coordinate of spike's tip
 * @prop {number} y1 - y coordinate of spike's tip
 * @prop {number} x2 - second point
 * @prop {number} y2 - second point
 * @prop {number} x3 - third point
 * @prop {number} y3 - third point
 * @prop {object} offset - the three point's relative to the circle's center
 *   @prop {number} offset.x1
 *   @prop {number} offset.y1
 *   @prop {number} offset.x2
 *   @prop {number} offset.y2
 *   @prop {number} offset.x3
 *   @prop {number} offset.y3
 * @prop {object} meta - simulation specific properties
 *   @prop {number|null} meta.deactivateTime
 */

const SPIKE_WIDTH = 6;
const HALF_WIDTH = SPIKE_WIDTH / 2;
const SPIKE_DRAIN = 320;
const SPIKES = [];

/**
 * Get's a point's X coordinates relative to the center of a meeba
 *
 * @param {number} angle - angle of point on circle
 * @param {number} distance - distance from the center
 * @returns {number}
 */
const getXOffset = (angle, distance) => Math.floor(cos(angle) * distance);

/**
 * Get's a point's X coordinates relative to the center of a meeba
 *
 * @param {number} angle - angle of point on circle
 * @param {number} distance - distance from the center
 * @returns {number}
 */
const getYOffset = (angle, distance) => Math.floor(-sin(angle) * distance);


/**
 * Creates a new spike, eventually reusing an old reference
 *
 * @param {number} radius - the radius of the parent body
 * @param {number} angle - the spike angle in turns
 * @param {number} length - the spike's length
 * @returns {Spike}
 */
export const spawnSpike = (radius, angle, length) => {
  // Store references so they can be reused later and avoid garbage collection
  /** @type {Spike} */
  const spike = {};
  SPIKES.push(spike);

  spike.fill = 'black';
  spike.drain = SPIKE_DRAIN;
  spike.length = length;

  // Absolute location will be set later by the simulation
  spike.x1 = 0;
  spike.y1 = 0;
  spike.x2 = 0;
  spike.y2 = 0;
  spike.x3 = 0;
  spike.y3 = 0;

  /** @type {Spike['offset']} */
  spike.offset = {};
  const offsetAngle = asin(HALF_WIDTH / radius);

  spike.offset.x1 = getXOffset(angle, length + radius);
  spike.offset.y1 = getYOffset(angle, length + radius);
  spike.offset.x2 = getXOffset(angle - offsetAngle, radius - 1);
  spike.offset.y2 = getYOffset(angle - offsetAngle, radius - 1);
  spike.offset.x3 = getXOffset(angle + offsetAngle, radius - 1);
  spike.offset.y3 = getYOffset(angle + offsetAngle, radius - 1);

  /** @type {Spike['meta']} */
  spike.meta = {};
  spike.meta.deactivateTime = null;

  return spike;
};

/**
 * Returns a function that updates the current location of a spike
 *
 * @param {number} x - the x position of the spike's meeba
 * @param {number} y - the x position of the spike's meeba
 * @returns {function(Spike): void} - mutates the spike's location
 */
export const getSpikeMover = (x, y) => (spike) => {
  spike.x1 = x + spike.offset.x1;
  spike.y1 = y + spike.offset.y1;
  spike.x2 = x + spike.offset.x2;
  spike.y2 = y + spike.offset.y2;
  spike.x3 = x + spike.offset.x3;
  spike.y3 = y + spike.offset.y3;
};
