import * as settings from './settings.js';
import {
  createGenome,
  readGenome,
  replicateGenome,
} from './meebas/genome.js';
import {
  spawnSpike,
  getSpikeMover,
} from './meebas/spikes.js';
import {
  initVitals,
  drainCalories,
} from './meebas/vitals.js';
import {
  toBytes,
  toHex,
} from './utils/arrays.js';
import {
  sqr,
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
 * @typedef {import('./meebas/spikes.js').Spike} Spike
 */

/**
 * @typedef {import('./meebas/vitals.js').Vitals} Vitals
 */

/**
 * @typedef {import('./utils/physics.js').Velocity} Velocity
 */

/**
 * A body to be simulated and drawn (an extension of physics Body)
 *
 * @typedef Body
 * @prop {boolean} isActive - whether the body should be simulated or not
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
 */

const MIN_MASS = Math.ceil(Math.PI * sqr(settings.meebas.minRadius));
const MAX_ENERGY = 2 * settings.simulation.energy / settings.simulation.bodies;
const COLOR_RANGE = 256 * 256 * 256;
const MAX_SEPARATION_ATTEMPTS = 10;
const SPIKE_HIGHLIGHT_TIME = 167;
const { width, height } = settings.tank;

/**
 * Creates a blank body to further initialize in other functions,
 * optionally reusing an existing body reference
 *
 * @param {Uint8Array} dna - dna to init with
 * @param {Body|null} [bodyRef] - a body to initialize; mutated!
 * @returns {Body}
 */
const initBody = (dna, bodyRef = null) => {
  const body = bodyRef !== null
    ? bodyRef
    : {
      isActive: false,
      dna: '',
      fill: 'black',
      x: 0,
      y: 0,
      mass: 0,
      radius: 0,
      velocity: {
        angle: 0,
        speed: 0,
      },
      vitals: {
        calories: 0,
        diesAt: 0,
        spawnsAt: 0,
        isDead: false,
      },
      spikes: [],
      meta: {
        nextX: 0,
        nextY: 0,
        lastCollisionBody: null,
      },
    };

  body.isActive = true;
  body.dna = toHex(dna);
  body.meta.lastCollisionBody = null;

  const { mass, spikes } = readGenome(dna);
  body.mass = MIN_MASS + mass;
  body.radius = Math.floor(Math.sqrt(body.mass / Math.PI));

  for (const { angle, length } of spikes) {
    body.spikes.push(spawnSpike(body.radius, angle, length));
  }
  // Sort spikes by length to speed up collision detection
  body.spikes.sort((a, b) => b.length - a.length);

  return body;
};

/**
 * Creates a new random Body
 *
 * @returns {Body}
 */
export const getRandomBody = () => {
  const body = initBody(createGenome());
  initVitals(body.vitals, body.mass);

  body.fill = `#${randInt(0, COLOR_RANGE).toString(16).padStart(6, '0')}`;

  body.x = randInt(body.radius, width - body.radius);
  body.y = randInt(body.radius, height - body.radius);
  body.velocity.angle = rand();
  body.velocity.speed = randInt(0, MAX_ENERGY / body.mass);

  return body;
};

/**
 * Generates a "new" body based on an existing parent, optionally reusing
 * an old body reference (pass null to generate a new body)
 *
 * @param {Body} parent - the parent to base the new body off of
 * @param {Body|null} [bodyRef] - the reference to overwrite; mutated!
 * @param {number} angle - the angle to launch the new body at
 * @returns {Body}
 */
const replicateParent = (parent, bodyRef = null, angle) => {
  const dna = replicateGenome(toBytes(parent.dna));
  const body = initBody(dna, bodyRef);
  initVitals(body.vitals, body.mass, Math.floor(parent.vitals.calories / 2));

  body.fill = parent.fill;

  const { x, y } = toVector({ angle, speed: 2 * body.radius });
  body.x = x + parent.x;
  body.y = y + parent.y;
  body.velocity.angle = angle;
  body.velocity.speed = parent.velocity.speed;

  const moveSpike = getSpikeMover(body.x, body.y);
  for (const spike of body.spikes) {
    moveSpike(spike);
  }

  return body;
};

/**
 * Removes a body and all of its spikes from the simulation, making these
 * references available for reuse;
 *
 * @param {Body} body - body to drop spikes from; mutated!
 */
const deactivateBody = (body) => {
  body.isActive = false;
  for (const spike of body.spikes) {
    spike.isActive = false;
  }
  body.spikes.length = 0;
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
 * Checks if two bodies can possibly interact by checking they are not the same object, and then
 * comparing their distance to the sum of their radii plus the primary's longest spike
 *
 * @param {Body} body - the primary body
 * @param {Body} other
 * @returns {boolean}
 */
const canInteract = (body, other) => {
  if (body === other) {
    return false;
  }

  const spikeLength = body.spikes.length > 0
    ? body.spikes[0].length
    : 0;

  return isShorter({
    x1: body.x,
    y1: body.y,
    x2: other.x,
    y2: other.y,
  }, body.radius + other.radius + spikeLength);
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
 * Checks if a spike's tip is within a body's circumference
 *
 * @param {Spike} spike
 * @param {Body} body
 * @returns {boolean}
 */
const isSpikeOverlapping = (spike, body) => isShorter({
  x1: body.x,
  y1: body.y,
  x2: spike.x1,
  y2: spike.y1,
}, body.radius);

/**
 * Gets a function to check if two bodies should collide, and mutates
 * their position and velocity as needed
 *
 * @param {number} delay - time passed since last move in seconds
 * @returns {function(Body, Body): void} - mutates the bodies as needed
 */
const getBodyCollider = (delay) => (body1, body2) => {
  const justCollided = body1.meta.lastCollisionBody === body2
    && body2.meta.lastCollisionBody === body1;
  const shouldCollide = !justCollided
    && (willOverlap(body1, body2) || isOverlapping(body1, body2));

  if (shouldCollide) {
    collide(body1, body2);
    getMoveCalculator(delay)(body1);
    getMoveCalculator(delay)(body2);
    body1.meta.lastCollisionBody = body2;
    body2.meta.lastCollisionBody = body1;
  }
};

/**
 * Gets a function to check if a body's spikes overlaps with another body and
 * drains calories as needed
 *
 * @param {number} delay - the time since the last tick
 * @param {number} tick - the current timestamp
 * @returns {function(Body, Body): void} - mutates bodies and spikes as needed
 */
const getSpikeActivator = (delay, tick) => (body, other) => {
  if (!body.vitals.isDead) {
    for (const spike of body.spikes) {
      if (isSpikeOverlapping(spike, other)) {
        spike.fill = 'red';
        spike.meta.deactivateTime = tick + SPIKE_HIGHLIGHT_TIME;

        const drainAmount = drainCalories(other.vitals, Math.floor(spike.drain * delay));
        body.vitals.calories += drainAmount;
      }
    }
  }
};

/**
 * Gets a function to run all body-to-body interactions, including physics
 * collisions and spike drain
 *
 * This O(n^2) implementation should eventually be replaced by an O(nlogn) quadtree
 *
 * @param {Body[]} bodies - all bodies in the simulation
 * @param {number} delay - the time since the last tick
 * @param {number} tick - the current timestamp
 * @returns {function(Body): void} - mutates bodies as needed
 */
const getBodyInteractor = (bodies, delay, tick) => (body) => {
  const collideBodies = getBodyCollider(delay);
  const activateSpikes = getSpikeActivator(delay, tick);

  for (const other of bodies) {
    if (canInteract(body, other)) {
      collideBodies(body, other);
      activateSpikes(body, other);
    }
  }
};

/**
 * Gets a function which deactivates a body's spikes if their activation time as expired
 *
 * @param {number} tick - the current timestamp
 * @returns {function(Body): void} - mutates any deactivating spikes
 */
const getSpikeDeactivator = (tick) => (body) => {
  for (const spike of body.spikes) {
    const { deactivateTime } = spike.meta;
    if (deactivateTime !== null && deactivateTime < tick) {
      spike.fill = 'black';
      spike.meta.deactivateTime = null;
    }
  }
};

/**
 * Checks life-cycle status of each body, killing, deacativating, or spawning as needed
 *
 * @param {Body[]} bodies - full array of bodies (including inactive)
 * @returns {function(Body): void} - mutates any deactivating spikes
 */
const getVitalChecker = (bodies) => (body) => {
  // Until more complex color handling is implemented, just turn dead meebas black
  if (body.vitals.isDead) {
    body.fill = 'black';
  }

  if (body.vitals.calories <= 0) {
    deactivateBody(body);
  }

  if (body.vitals.calories >= body.vitals.spawnsAt) {
    const childRef = bodies.find(({ isActive }) => !isActive);

    deactivateBody(body);
    const child = replicateParent(body, childRef, body.velocity.angle + 0.125);
    replicateParent(body, body, body.velocity.angle - 0.125);

    if (childRef === undefined) {
      bodies.push(child);
    }
  }
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
  const activeBodies = bodies.filter(body => body.isActive);

  const calcMove = getMoveCalculator(delay);
  const bounceWall = getWallBouncer(delay);
  const interactBodies = getBodyInteractor(bodies, delay, thisTick);
  const deactivateSpikes = getSpikeDeactivator(thisTick);
  const checkVitals = getVitalChecker(bodies);

  activeBodies.forEach(calcMove);
  activeBodies.forEach(bounceWall);
  activeBodies.forEach(interactBodies);
  activeBodies.forEach(deactivateSpikes);
  activeBodies.forEach(moveBody);
  activeBodies.forEach(checkVitals);
};
