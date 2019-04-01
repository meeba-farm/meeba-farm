import { settings } from '../settings.js';
import {
  createGenome,
  readGenome,
  replicateGenome,
} from './genome.js';
import {
  spawnSpike,
  getSpikeMover,
} from './spikes.js';
import {
  initVitals,
  setCalories,
} from './vitals.js';
import {
  toBytes,
  toHex,
} from '../utils/arrays.js';
import {
  sqr,
  rand,
  randInt,
} from '../utils/math.js';
import {
  toVector,
} from '../utils/physics.js';

/**
 * @typedef {import('./spikes.js').Spike} Spike
 */

/**
 * @typedef {import('./vitals.js').Vitals} Vitals
 */

/**
 * @typedef {import('../utils/physics.js').Velocity} Velocity
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
 * @prop {Vitals} vitals - life-cycle properties of the body
 * @prop {Spike[]} spikes - the spikes of the meeba
 * @prop {object} meta - extra properties specific to the simulation
 *   @prop {number} meta.nextX - body's next horizontal location
 *   @prop {number} meta.nextY - body's next vertical location
 *   @prop {Body|null} meta.lastCollisionBody - last body collided with
 * @prop {boolean} [isInactive] - the body should be removed from the simulation
 */

const { width, height, energy, startingBodies } = settings.core;
const MIN_RADIUS = 10;
const MIN_MASS = Math.ceil(Math.PI * sqr(MIN_RADIUS));
const MAX_ENERGY = 2 * energy / startingBodies;
const MAX_REPRODUCTION_ENERGY = MAX_ENERGY * 0.75;
const COLOR_RANGE = 256 * 256 * 256;
const MOTE_COLOR = '#792';
const MOTE_RADIUS = 8;
const MOTE_MASS = Math.ceil(Math.PI * sqr(MOTE_RADIUS));
const MAX_MOTE_SPEED = Math.floor(MAX_ENERGY / MOTE_MASS / 32);

/**
 * Generates a new body from dna and default values
 *
 * @param {Uint8Array} dna - dna to init with
 * @returns {Body}
 */
const initBody = (dna) => {
  const dnaCommands = readGenome(dna);
  const mass = MIN_MASS + dnaCommands.size;
  const radius = Math.floor(Math.sqrt(mass / Math.PI));

  const spikes = dnaCommands.spikes
    .map(({ angle, length }) => spawnSpike(radius, angle, length))
    .sort((a, b) => b.length - a.length);

  return {
    dna: toHex(dna),
    fill: 'black',
    x: 0,
    y: 0,
    mass,
    radius,
    velocity: {
      angle: 0,
      speed: 0,
    },
    vitals: initVitals(mass, spikes),
    spikes,
    meta: {
      nextX: 0,
      nextY: 0,
      lastCollisionBody: null,
    },
  };
};

/**
 * Creates a new random Body
 *
 * @returns {Body}
 */
export const getRandomBody = () => {
  const body = initBody(createGenome());

  body.fill = `#${randInt(0, COLOR_RANGE).toString(16).padStart(6, '0')}`;
  body.x = randInt(body.radius, width - body.radius);
  body.y = randInt(body.radius, height - body.radius);
  body.velocity.angle = rand();
  body.velocity.speed = randInt(0, MAX_ENERGY / body.mass);

  return body;
};

/**
 * Generates a "new" body based on an existing parent
 *
 * @param {Body} parent - the parent to base the new body off of
 * @param {number} angle - the angle to launch the new body at
 * @returns {Body}
 */
export const replicateParent = (parent, angle) => {
  const dna = replicateGenome(toBytes(parent.dna));
  const body = initBody(dna);
  body.fill = parent.fill;

  setCalories(body.vitals, Math.floor(parent.vitals.calories / 2));

  const relativeLocation = toVector({ angle, speed: 2 * body.radius });
  body.x = parent.x + relativeLocation.x;
  body.y = parent.y + relativeLocation.y;
  body.velocity.angle = angle;
  body.velocity.speed = parent.velocity.speed + randInt(0, MAX_REPRODUCTION_ENERGY / body.mass);

  body.spikes.forEach(getSpikeMover(body.x, body.y));

  return body;
};

/**
 * Creates a random "mote", a spikeless body with no calorie upkeep,
 * which will drift around until consumed
 *
 * @returns {Body}
 */
export const spawnMote = () => ({
  dna: '',
  fill: MOTE_COLOR,
  x: randInt(MOTE_RADIUS, width - MOTE_RADIUS),
  y: randInt(MOTE_RADIUS, height - MOTE_RADIUS),
  mass: MOTE_MASS,
  radius: MOTE_RADIUS,
  velocity: {
    angle: rand(),
    speed: randInt(0, MAX_MOTE_SPEED),
  },
  vitals: {
    calories: MOTE_MASS * 2,
    upkeep: 0,
    isDead: false,
    spawnsAt: Number.MAX_SAFE_INTEGER,
    diesAt: 0,
  },
  spikes: [],
  meta: {
    nextX: 0,
    nextY: 0,
    lastCollisionBody: null,
  },
});
