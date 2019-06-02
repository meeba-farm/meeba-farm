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
  flatten,
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
 * @typedef {import('./utils/objects.js').Tweener} Tweener
 */

/**
 * @typedef {import('./utils/physics.js').Velocity} Velocity
 */

/**
 * Dynamically calculated simulation settings
 *
 * @typedef DynamicSimulationSettings
 * @prop {number} bodyLimit
 * @prop {number} minSpikeFadeTime
 * @prop {number} maxSpikeFadeTime
 * @prop {number} maxSpikeFadeDistance
 */

const MAX_TIME_PER_FRAME = 0.1;
const MAX_SEPARATION_ATTEMPTS = 10;

const { core, bodies: bodySettings, simulation: fixed } = settings;
const dynamic = /** @type {DynamicSimulationSettings} */ ({});
addUpdateListener(() => {
  const { moteRadius } = bodySettings;
  const maxMotes = Math.ceil((core.width / moteRadius / 2) * (core.height / moteRadius / 2));
  dynamic.bodyLimit = Math.min(fixed.maxBodies, maxMotes);

  dynamic.minSpikeFadeTime = Math.floor(0.5 * fixed.averageSpikeFadeTime);
  dynamic.maxSpikeFadeTime = Math.floor(1.5 * fixed.averageSpikeFadeTime);
  dynamic.maxSpikeFadeDistance = 2 * fixed.averageSpikeFadeDistance;
});

/** @type {Tweener[]} */
let tweens = [];

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
 * Checks if a body is close enough to another that a spike drain or collision are possible
 *
 * Note that this checks based on the bodies' next location. This could lead to some
 * odd behavior if bodies are currently overlapping, but their next location is not
 *
 * @param {Body} body - the primary body
 * @param {Body} other
 * @returns {boolean}
 */
const bodyInRange = (body, other) => {
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
const bodiesDoOverlap = (body1, body2) => isShorter({
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
const bodiesWillOverlap = (body1, body2) => isShorter({
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
    && (bodiesWillOverlap(body1, body2) || bodiesDoOverlap(body1, body2));

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
        tweens.push(lightnessTween);

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
const getBodyInteractor = (bodies, delay, tick) => {
  const interactiveBodies = bodies.filter(({ meta }) => meta.canInteract);

  return (body) => {
    const collideIfValid = getBodyCollider(delay);
    const activateSpikesIfValid = getSpikeActivator(delay, tick);

    for (const other of interactiveBodies) {
      // Anything in this loop is O(n^2), bail as soon as possible
      if (body !== other && bodyInRange(body, other)) {
        collideIfValid(body, other);
        activateSpikesIfValid(body, other);
      }
    }
  };
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
 * Gets a function to add fade out tweens to a spike
 *
 * @param {number} tick - the current timestamp
 * @param {Velocity} velocity - the original velocity of the spike's body
 * @returns {function(Spike): void} - mutates calories
 */
const getSpikeFader = (tick, velocity) => {
  const originalVector = toVector(velocity);

  return (spike) => {
    const { angle, fill } = spike;
    const fadeTime = randInt(dynamic.minSpikeFadeTime, dynamic.maxSpikeFadeTime);

    fill.a = 1;
    tweens.push(getTweener(fill, { a: 0 }, tick, fadeTime));

    const speed = Math.floor(1000 * randInt(0, dynamic.maxSpikeFadeDistance) / fadeTime);
    const spikeVector = toVector({ angle, speed });
    const deltaX = originalVector.x + spikeVector.x;
    const deltaY = originalVector.y + spikeVector.y;

    tweens.push(getTweener(spike, {
      x1: spike.x1 + deltaX,
      y1: spike.y1 + deltaY,
      x2: spike.x2 + deltaX,
      y2: spike.y2 + deltaY,
      x3: spike.x3 + deltaX,
      y3: spike.y3 + deltaY,
    }, tick, fadeTime));
  };
};

/**
 * Gets a function which will checks if a body should be dead, if so
 * marks it as such and adds death tweens
 *
 * @param {number} tick - the current timestamp
 * @returns {function(Body): void}
 */
const getDeathChecker = (tick) => (body) => {
  const { vitals, velocity, spikes } = body;
  if (!vitals.isDead && vitals.calories < vitals.diesAt) {
    vitals.isDead = true;

    const fadeSpike = getSpikeFader(tick, velocity);
    spikes.forEach(fadeSpike);

    // Remove spikes after last one has faded
    tweens.push(getTweener(body, { spikes: [] }, tick, dynamic.maxSpikeFadeTime));
  }
};

/**
 * Gets a function which will checks if a body should be removed, if so
 * adds removal tweens which will eventually mark the body to be removed
 *
 * @param {number} tick - the current timestamp
 * @returns {function(Body): void}
 */
const getRemovalChecker = (tick) => ({ fill, vitals, meta }) => {
  if (meta.canInteract && vitals.calories <= 0) {
    meta.canInteract = false;

    fill.a = 1;
    tweens.push(getTweener(fill, { a: 0 }, tick, fixed.bodyRemovalFadeTime));
    tweens.push(getTweener(meta, { isSimulated: false }, tick, dynamic.maxSpikeFadeTime));
  }
};

/**
 * Gets a function to check if a body should spawn children. Will return the children
 * to add to the simulation if any
 *
 * @param {number} tick - the current timestamp
 * @returns {function(Body): Body[]}
 */
const getChildSpawner = (tick) => (body) => {
  if (body.vitals.calories < body.vitals.spawnsAt) {
    return [];
  }

  body.meta.isSimulated = false;
  const children = [
    replicateParent(body, body.velocity.angle + 0.125),
    replicateParent(body, body.velocity.angle - 0.125),
  ];

  for (const { fill, meta } of children) {
    fill.a = 0.2;
    tweens.push(getTweener(fill, { a: 1 }, tick, fixed.bodySpawnFadeTime));

    meta.canInteract = false;
    tweens.push(getTweener(meta, { canInteract: true }, tick, fixed.bodySpawnInactiveTime));
  }

  return children;
};

/**
 * Adjusts the saturation of a body based on its current calories
 *
 * @param {Body} body
 */
const adjustSaturation = (body) => {
  const { calories, spawnsAt } = body.vitals;
  body.fill.s = Math.floor(normalize(calories, 0, spawnsAt) * 100);
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
        if (body !== other && bodiesDoOverlap(body, other)) {
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
  const checkDeath = getDeathChecker(stop);
  const checkRemoval = getRemovalChecker(stop);
  const spawnChildren = getChildSpawner(stop);

  bodies.forEach(calcMove);
  bodies.forEach(bounceWall);
  bodies.forEach(interactBodies);
  bodies.forEach(moveBody);
  bodies.forEach(upkeepCalories);
  bodies.forEach(adjustSaturation);
  bodies.forEach(checkDeath);
  bodies.forEach(checkRemoval);

  // Run tweens and remove if done
  tweens = tweens.filter(tween => tween(stop));

  const newMotes = bodies.length < dynamic.bodyLimit ? getNewMotes(delay) : [];
  const newChildren = flatten(bodies.map(spawnChildren));

  return bodies
    .filter(({ meta }) => meta.isSimulated)
    .concat(newMotes, newChildren);
};
