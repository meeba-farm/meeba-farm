import {
  settings,
  addUpdateListener,
} from './settings.js';
import {
  replicateParent,
  spawnMote,
} from './meebas/bodies.js';
import {
  getSpikeMover,
} from './meebas/spikes.js';
import {
  drainCalories,
} from './meebas/vitals.js';
import {
  range,
} from './utils/arrays.js';
import {
  getGap,
  isShorter,
  isCloser,
  normalize,
  rand,
  randInt,
} from './utils/math.js';
import {
  getTweener,
} from './utils/objects.js';
import {
  toVector,
  bounceX,
  bounceY,
  collide,
} from './utils/physics.js';

/**
 * @typedef {import('./meebas/bodies.js').Body} Body
 */

/**
 * @typedef {import('./meebas/spikes.js').Spike} Spike
 */

/**
 * @typedef {import('./meebas/vitals.js').Vitals} Vitals
 */

/**
 * @typedef {import('./utils/physics.js').Velocity} Velocity
 */

const MAX_TIME_PER_FRAME = 0.1;
const MAX_SEPARATION_ATTEMPTS = 10;

const { core, bodies: bodySettings, simulation: fixed } = settings;

let bodyLimit = 0;
addUpdateListener(() => {
  const { moteRadius } = bodySettings;
  const maxMotes = Math.ceil((core.width / moteRadius / 2) * (core.height / moteRadius / 2));
  bodyLimit = Math.min(fixed.maxBodies, maxMotes);
});

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

  if (getGap(0, angle) < 0.25 && nextX > core.width - radius) {
    bounceX(body);
  } else if (getGap(0.25, angle) < 0.25 && nextY < radius) {
    bounceY(body);
  } else if (getGap(0.5, angle) < 0.25 && nextX < radius) {
    bounceX(body);
  } else if (getGap(0.75, angle) < 0.25 && nextY > core.height - radius) {
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
 * Note that this checks based on the bodies' next location. This could lead to some
 * odd behavior if bodies are currently overlapping, but their next location is not
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
    x1: body.meta.nextX,
    y1: body.meta.nextY,
    x2: other.meta.nextX,
    y2: other.meta.nextY,
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
 * Gets a function which will check if a spike is overlapping another body
 *
 * @param {Body} body
 * @param {Body} other
 * @returns {function(Spike): boolean}
 */
const getSpikeOverlapChecker = (body, other) => (spike) => {
  // If spike is shorter than other's diameter, use faster check
  if (spike.length < 2 * other.radius) {
    return isShorter({
      x1: other.x,
      y1: other.y,
      x2: spike.x1,
      y2: spike.y1,
    }, other.radius);
  }

  return isCloser(other, {
    x1: body.x,
    y1: body.y,
    x2: spike.x1,
    y2: spike.y1,
  }, other.radius);
};


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
    const isSpikeOverlapping = getSpikeOverlapChecker(body, other);
    for (const spike of body.spikes) {
      if (isSpikeOverlapping(spike)) {
        const { fill } = spike;
        fill.l = 50;
        const lightnessTween = getTweener(fill, { l: 0 }, tick, fixed.spikeHighlightTime);
        body.meta.tweens.push(lightnessTween);

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
 * Gets a function drains calories from a body based on its upkeep and time elapsed
 *
 * @param {number} delay - the time in seconds since the last tick
 * @returns {function(Body): void} - mutates calories
 */
const getCalorieUpkeeper = (delay) => (body) => {
  if (!body.vitals.isDead) {
    drainCalories(body.vitals, delay * body.vitals.upkeep);
  }
};

/**
 * Checks life-cycle status of each body, killing, deactivating, or spawning as needed
 *
 * @param {Body[]} bodies - full array of bodies (including inactive)
 * @returns {function(Body): void} - mutates any deactivating spikes
 */
const getVitalChecker = (bodies) => (body) => {
  if (body.vitals.calories <= 0) {
    body.isInactive = true;
  }

  if (body.vitals.calories >= body.vitals.spawnsAt) {
    const child1 = replicateParent(body, body.velocity.angle + 0.125);
    const child2 = replicateParent(body, body.velocity.angle - 0.125);

    bodies.push(child1);
    bodies.push(child2);

    body.isInactive = true;
  }
};

/**
 * Adjusts the saturation of a body based on its current calories
 *
 * @param {Body} body
 */
const adjustSaturation = (body) => {
  const { calories, diesAt, spawnsAt } = body.vitals;
  body.fill.s = Math.floor(normalize(calories, diesAt, spawnsAt) * 100);
};

/**
 * Returns an array of new motes to add based on spawn rate and the delay since the last frame
 *
 * @param {number} delay - the time passed since the last frame
 * @returns {Body[]} - the new motes
 */
const getNewMotes = (delay) => {
  const chance = core.moteSpawnRate * delay;
  const motes = range(Math.floor(chance)).map(spawnMote);

  if (rand() < chance % 1) {
    motes.push(spawnMote());
  }

  return motes;
};

/**
 * Gets a function which will run a body's tweening functions and remove them if they are done
 *
 * @param {number} tick - the current timestamp
 * @returns {function(Body): void} - the new motes
 */
const getTweenRunner = (tick) => ({ meta }) => {
  // Run tweens and remove if done
  meta.tweens = meta.tweens.filter(tween => !tween(tick));
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
          body.x = randInt(body.radius, core.width - body.radius);
          body.y = randInt(body.radius, core.height - body.radius);
        }
      }
    }
  }
};

/**
 * Gets a function to calculate a "frame" of the simulation
 *
 * @param {Body[]} bodies - all the bodies to simulate
 * @param {number} start - the timestamp of the previous frame
 * @param {number} stop - the timestamp of the current frame
 * @returns {Body[]} - new array with inactive bodies removed
 */
export const simulateFrame = (bodies, start, stop) => {
  const delay = Math.min((stop - start) / 1000, MAX_TIME_PER_FRAME);

  const calcMove = getMoveCalculator(delay);
  const bounceWall = getWallBouncer(delay);
  const interactBodies = getBodyInteractor(bodies, delay, stop);
  const upkeepCalories = getCalorieUpkeeper(delay);
  const checkVitals = getVitalChecker(bodies);
  const runTweens = getTweenRunner(stop);

  bodies.forEach(calcMove);
  bodies.forEach(bounceWall);
  bodies.forEach(interactBodies);
  bodies.forEach(moveBody);
  bodies.forEach(upkeepCalories);
  bodies.forEach(checkVitals);
  bodies.forEach(adjustSaturation);
  bodies.forEach(runTweens);

  const newMotes = bodies.length < bodyLimit ? getNewMotes(delay) : [];

  return bodies
    .filter(body => !body.isInactive)
    .concat(newMotes);
};
