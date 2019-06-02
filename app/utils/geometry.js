import { sqr, dotProduct } from './math.js';
import { toVector, toVelocity } from './physics.js';

/**
 * A point defined by an x/y coordinate
 *
 * @typedef Point
 * @prop {number} x
 * @prop {number} y
 */

/**
 * A line segment defined by a pair of x/y coordinates
 *
 * @typedef Line
 * @prop {number} x1
 * @prop {number} y1
 * @prop {number} x2
 * @prop {number} y2
 */

/**
 * A circle defined by an x/y center point and a radius
 *
 * @typedef Circle
 * @prop {number} x
 * @prop {number} y
 * @prop {number} radius
 */

/**
 * Efficiently checks if a line is shorter than a distance (no sqrt)
 *
 * @param {Line} line
 * @param {number} distance
 * @returns {boolean}
 */
export const isShorter = ({ x1, y1, x2, y2 }, distance) => (
  sqr(x1 - x2) + sqr(y1 - y2) < sqr(distance)
);

/**
 * Checks if a point is closer to a line segment than a certain distance (no sqrt),
 * adapted from this StackOverflow answer: https://stackoverflow.com/a/6853926/4284401
 *
 * @param {Point} point
 * @param {Line} line
 * @param {number} distance
 * @returns {boolean}
 */
export const isCloser = ({ x, y }, { x1, y1, x2, y2 }, distance) => {
  const xLength = x2 - x1;
  const yLength = y2 - y1;

  const lengthSquared = dotProduct([xLength, yLength], [xLength, yLength]);
  const projection = lengthSquared > 0
    ? dotProduct([x - x1, y - y1], [xLength, yLength]) / lengthSquared
    : -1;

  let closestX;
  let closestY;
  if (projection < 0) {
    closestX = x1;
    closestY = y1;
  } else if (projection > 1) {
    closestX = x2;
    closestY = y2;
  } else {
    closestX = x1 + projection * xLength;
    closestY = y1 + projection * yLength;
  }

  return isShorter({
    x1: x,
    y1: y,
    x2: closestX,
    y2: closestY,
  }, distance);
};

/**
 * Moves a second circle so it touches the edge of a target circle,
 * optionally leaving a gap between
 *
 * @param {Circle} target - base circle, unmoved
 * @param {Circle} other - moved circle, mutated!
 * @param {number} [gap] - number of pixels to leave between, defaults to 0
 *
 */
export const snapCircleToEdge = ({ x, y, radius }, other, gap = 0) => {
  const { angle } = toVelocity({
    x: x - other.x,
    y: y - other.y,
  });
  const separation = toVector({
    angle,
    speed: radius + other.radius + gap,
  });

  other.x = x - separation.x;
  other.y = y - separation.y;
};
