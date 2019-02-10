import * as settings from './settings.js';
import {
  createGenome,
  readGenome,
} from './meebas/genome.js';
import {
  spawnSpike,
  getSpikeMover,
} from './meebas/spikes.js';
import {
  toHex,
} from './utils/arrays.js';
import {
  PI_2,
  getGap,
  isShorter,
  rand,
  randInt,
} from './utils/math.js';
import {
  toVector,
  bounceX,
  bounceY,
  collide,
} from './utils/physics.js';

/**
 * @typedef Spike {import('./meebas/spikes.js').Spike}
 */

/**
 * @typedef Velocity {import('./utils/physics.js').Velocity}
 */

/**
 * A body to be simulated and drawn (an extension of physics Body)
 *
 * @typedef Body
 * @prop {string} dna - a hex-string genome
 * @prop {string} fill - a valid color string
 * @prop {number} x - horizontal location
 * @prop {number} y - vertical location
 * @prop {number} mass - measurement of size/mass
 * @prop {number} radius - radius in pixels
 * @prop {Velocity} velocity - speed and direction of body
 * @prop {Spike[]} spikes - the spikes of the meeba
 * @prop {object} meta - extra properties specific to the simulation
 *   @prop {number|null} meta.nextX - body's next horizontal location
 *   @prop {number|null} meta.nextY - body's next vertical location
 *   @prop {Body|null} meta.lastCollisionBody - last body collided with
 */

const MIN_MASS = Math.ceil(PI_2 * settings.meebas.minRadius);
const MAX_ENERGY = 2 * settings.simulation.energy / settings.simulation.bodies;
const COLOR_RANGE = 256 * 256 * 256;
const MAX_SEPARATION_ATTEMPTS = 10;
const { width, height } = settings.tank;

/**
 * Creates a new body to simulate, optionally reusing an old reference to avoid garbage collection
 *
 * @param {Body} [body] - an old body reference to overwrite; mutated!
 * @returns {Body}
 */
export const spawnBody = (body = { velocity: {}, spikes: [], meta: {} }) => {
  const dna = createGenome();
  body.dna = toHex(dna);
  body.fill = `#${randInt(0, COLOR_RANGE).toString(16).padStart(6, '0')}`;

  const { mass, spikes } = readGenome(dna);
  body.mass = MIN_MASS + mass;
  body.radius = Math.floor(body.mass / PI_2);

  body.x = randInt(body.radius, width - body.radius);
  body.y = randInt(body.radius, height - body.radius);
  body.velocity.angle = rand();
  body.velocity.speed = randInt(0, MAX_ENERGY / body.mass);

  body.spikes.length = 0;
  for (const { angle, length } of spikes) {
    body.spikes.push(spawnSpike(body.radius, angle, length));
  }

  body.meta.nextX = null;
  body.meta.nextY = null;
  body.meta.lastCollisionBody = null;

  return body;
};

/**
 * Gets a function to calculate the next location of a body
 *
 * @param {number} delay - time passed since last move in seconds
 * @returns {function(Body): void} - mutates the nextX and nextY of a body
 */
const getMoveCalculator = (delay) => (body) => {
  const { x, y } = toVector(body.velocity);
  body.meta.nextX = body.x + x * delay;
  body.meta.nextY = body.y + y * delay;
};

/**
 * Updates the x/y of a body based on its previously calculated nextX/nextY
 *
 * @param {Body} body - mutated!
 */
const moveBody = (body) => {
  body.x = body.meta.nextX;
  body.y = body.meta.nextY;
  body.meta.nextX = null;
  body.meta.nextY = null;

  const moveSpike = getSpikeMover(body.x, body.y);
  body.spikes.forEach(moveSpike);
};

/**
 * Gets a function to determine if a body should bounce off a wall,
 * and then mutate its velocity appropriately
 *
 * @param {number} delay - time passed since last move in seconds
 * @returns {function(Body): void} - mutates the velocity of the body if needed
 */
const getWallBouncer = (delay) => (body) => {
  const { radius, velocity: { angle }, meta: { nextX, nextY } } = body;

  if (getGap(0, angle) < 0.25 && nextX > width - radius) {
    bounceX(body);
  } else if (getGap(0.25, angle) < 0.25 && nextY < radius) {
    bounceY(body);
  } else if (getGap(0.5, angle) < 0.25 && nextX < radius) {
    bounceX(body);
  } else if (getGap(0.75, angle) < 0.25 && nextY > height - radius) {
    bounceY(body);
  } else {
    return;
  }

  getMoveCalculator(delay)(body);
  body.meta.lastCollisionBody = null;
};

/**
 * Checks if two bodies currently overlap by comparing the distance between
 * their centers and the sum of their radii
 *
 * @param {Body} body1
 * @param {Body} body2
 * @returns {boolean}
 */
const isOverlapping = (body1, body2) => isShorter({
  x1: body1.x,
  y1: body1.y,
  x2: body2.x,
  y2: body2.y,
}, body1.radius + body2.radius);

/**
 * Checks if two bodies *will* overlap based on their next positions
 *
 * @param {Body} body1
 * @param {Body} body2
 * @returns {boolean}
 */
const willOverlap = (body1, body2) => isShorter({
  x1: body1.meta.nextX,
  y1: body1.meta.nextY,
  x2: body2.meta.nextX,
  y2: body2.meta.nextY,
}, body1.radius + body2.radius);

/**
 * Gets a function to check if a body should collide with any other bodies and
 * mutate the velocity of both bodies appropriately
 *
 * This O(n^2) implementation should eventually be replaced by an O(nlogn) quadtree
 *
 * @param {Body[]} bodies - all bodies in the simulation
 * @param {number} delay - time passed since last move in seconds
 * @returns {function(Body): void} - mutates the velocity of the body if needed
 */
const getBodyCollider = (bodies, delay) => (body) => {
  bodies.forEach((other) => {
    const shouldCollide = body !== other
      && body.meta.lastCollisionBody !== other
      && (willOverlap(body, other) || isOverlapping(body, other));

    if (shouldCollide) {
      collide(body, other);
      getMoveCalculator(delay)(body);
      body.meta.lastCollisionBody = other;
      other.meta.lastCollisionBody = body;
    }
  });
};

/**
 * Takes an array of bodies and teleports them randomly until none overlap
 *
 * @param {Body[]} bodies - mutated!
 */

export const separateBodies = (bodies) => {
  let attempts = 0;
  let overlapsFound = true;

  while (attempts < MAX_SEPARATION_ATTEMPTS && overlapsFound) {
    attempts += 1;
    overlapsFound = false;

    for (const body of bodies) {
      for (const other of bodies) {
        if (body !== other && isOverlapping(body, other)) {
          overlapsFound = true;
          body.x = randInt(body.radius, width - body.radius);
          body.y = randInt(body.radius, height - body.radius);
        }
      }
    }
  }
};

/**
 * Gets a function to calculate a "frame" of the simulation
 *
 * @param {Body[]} bodies - all the bodies to simulate
 * @param {number} lastTick - the time of the last frame
 * @returns {function(number): void}
 */
export const getSimulator = (bodies, lastTick) => (thisTick) => {
  const delay = (thisTick - lastTick) / 1000;
  // eslint-disable-next-line no-param-reassign
  lastTick = thisTick;

  const calcMove = getMoveCalculator(delay);
  const bounceWall = getWallBouncer(delay);
  const collideBody = getBodyCollider(bodies, delay);

  bodies.forEach(calcMove);
  bodies.forEach(bounceWall);
  bodies.forEach(collideBody);
  bodies.forEach(moveBody);
};
