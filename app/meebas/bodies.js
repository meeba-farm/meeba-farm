import {
  settings,
  addUpdateListener,
} from '../settings.js';
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
 * @typedef {import('../utils/colors.js').HSL} HSL
 */

/**
 * @typedef {import('../utils/physics.js').Velocity} Velocity
 */

/**
 * A body to be simulated and drawn (an extension of physics Body)
 *
 * @typedef Body
 * @prop {string} dna - a hex-string genome
 * @prop {HSL} fill - a valid color string
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

/**
 * Dynamically calculated body settings
 *
 * @typedef DynamicBodySettings
 * @prop {number} minMass
 * @prop {number} maxEnergy
 * @prop {number} moteMass
 * @prop {number} moteStartingCalories
 * @prop {number} moteMaxSpeed
 * @prop {number} moteBorderRight
 * @prop {number} moteBorderBottom
 * @prop {number} maxSpawningEnergy
 */

const { core, bodies: fixed } = settings;
const dynamic = /** @type DynamicBodySettings */ ({});
addUpdateListener(() => {
  dynamic.minMass = Math.ceil(Math.PI * sqr(fixed.minRadius));
  dynamic.maxEnergy = Math.ceil(2 * core.energy * fixed.initialEnergyAdjustment);
  dynamic.moteMass = Math.ceil(Math.PI * sqr(fixed.moteRadius));
  dynamic.moteStartingCalories = Math.ceil(dynamic.moteMass * fixed.moteCalorieAdjustment);
  dynamic.moteMaxSpeed = Math.ceil(2 * core.energy / dynamic.moteMass * fixed.moteSpeedAdjustment);
  dynamic.moteBorderRight = core.width - fixed.moteRadius;
  dynamic.moteBorderBottom = core.height - fixed.moteRadius;
  dynamic.maxSpawningEnergy = Math.ceil(2 * core.energy * fixed.spawningEnergyAdjustment);
});

/**
 * Generates a new body from dna and default values
 *
 * @param {Uint8Array} dna - dna to init with
 * @returns {Body}
 */
const initBody = (dna) => {
  const dnaCommands = readGenome(dna);
  const mass = dynamic.minMass + dnaCommands.size;
  const radius = Math.floor(Math.sqrt(mass / Math.PI));

  const spikes = dnaCommands.spikes
    .map(({ angle, length }) => spawnSpike(radius, angle, length))
    .sort((a, b) => b.length - a.length);

  return {
    dna: toHex(dna),
    fill: {
      h: dnaCommands.hue,
      s: 100,
      l: fixed.meebaLightness,
    },
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

  body.x = randInt(body.radius, core.width - body.radius);
  body.y = randInt(body.radius, core.height - body.radius);
  body.velocity.angle = rand();
  body.velocity.speed = randInt(0, dynamic.maxEnergy / body.mass);

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

  setCalories(body.vitals, Math.floor(parent.vitals.calories / 2));

  const relativeLocation = toVector({ angle, speed: 2 * body.radius });
  body.x = parent.x + relativeLocation.x;
  body.y = parent.y + relativeLocation.y;
  body.velocity.angle = angle;
  body.velocity.speed = parent.velocity.speed + randInt(0, dynamic.maxSpawningEnergy / body.mass);

  body.spikes.forEach(getSpikeMover(body.x, body.y));

  return body;
};

/**
 * Creates a random "mote", a spikeless body with no calorie upkeep,
 * which will drift around until consumed
 *
 * @returns {Body}
 */
export const spawnMote = () => {
  const { moteRadius } = fixed;
  const { moteStartingCalories } = dynamic;

  return {
    dna: '',
    fill: {
      h: fixed.moteHue,
      s: 100,
      l: fixed.moteLightness,
    },
    x: randInt(moteRadius, dynamic.moteBorderRight),
    y: randInt(moteRadius, dynamic.moteBorderBottom),
    mass: dynamic.moteMass,
    radius: moteRadius,
    velocity: {
      angle: rand(),
      speed: randInt(0, dynamic.moteMaxSpeed),
    },
    vitals: {
      calories: moteStartingCalories,
      upkeep: 0,
      isDead: false,
      spawnsAt: moteStartingCalories + 1,
      diesAt: 0,
    },
    spikes: [],
    meta: {
      nextX: 0,
      nextY: 0,
      lastCollisionBody: null,
    },
  };
};
