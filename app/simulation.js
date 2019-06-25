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
  flatMap,
} from './utils/arrays.js';
import {
  isShorter,
  isCloser,
  snapCircleToEdge,
} from './utils/geometry.js';
import {
  normalize,
  getGap,
  rand,
  randInt,
} from './utils/math.js';
import {
  easeIn,
  easeOut,
  getOnCompleteTransformer,
  getTweener,
} from './utils/tweens.js';
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
 * @typedef {import('./utils/tweens.js').Tweener} Tweener
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
const SNAP_GAP = 0.1;

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
 * Gets a function to move a body to its next location based on its velocity
 *
 * @param {number} delay - time passed since last move in seconds
 * @returns {function(Body): void} - mutates the x/y a body
 */
const getBodyMover = (delay) => (body) => {
  const { x, y } = toVector(body.velocity);
  body.x += x * delay;
  body.y += y * delay;

  const moveSpike = getSpikeMover(body.x, body.y);
  body.spikes.forEach(moveSpike);
};

/**
 * Checks if a body is past a wall of the tank, and bounces it if so
 *
 * @param {Body} body - mutated!
 */
const bounceWallIfPast = (body) => {
  const { x, y, radius, velocity: { angle } } = body;

  if (getGap(0, angle) < 0.25 && x > core.width - radius) {
    bounceX(body);
  } else if (getGap(0.25, angle) < 0.25 && y < radius) {
    bounceY(body);
  } else if (getGap(0.5, angle) < 0.25 && x < radius) {
    bounceX(body);
  } else if (getGap(0.75, angle) < 0.25 && y > core.height - radius) {
    bounceY(body);
  }
};

/**
 * Checks if a body is close enough to another that a spike drain or collision are possible
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
const bodiesDoOverlap = (body1, body2) => isShorter({
  x1: body1.x,
  y1: body1.y,
  x2: body2.x,
  y2: body2.y,
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
 * @param {Body} body1 - mutated!
 * @param {Body} body2 - mutated!
 */
const collideIfOverlapping = (body1, body2) => {
  if (bodiesDoOverlap(body1, body2)) {
    // Move smaller body outside larger body
    if (body1.radius > body2.radius) {
      snapCircleToEdge(body1, body2, SNAP_GAP);
    } else {
      snapCircleToEdge(body2, body1, SNAP_GAP);
    }

    collide(body1, body2);
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
        const highlightTween = getTweener(fill)
          .addFrame(fixed.spikeHighlightTime, { l: 0 })
          .start(tick);
        tweens.push(highlightTween);

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
  const activateSpikesIfValid = getSpikeActivator(delay, tick);

  return (body) => {
    if (body.meta.canInteract) {
      for (const other of interactiveBodies) {
        // Anything in this loop is O(n^2), bail as soon as possible
        if (body !== other && bodyInRange(body, other)) {
          collideIfOverlapping(body, other);
          activateSpikesIfValid(body, other);
        }
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
    // Start spike fade with a random delay, but before body fades
    const start = tick + randInt(0, fixed.bodyRemovalFadeTime);

    const fadeTween = getTweener(fill)
      .addFrame(fadeTime, { a: 0 }, easeIn)
      .start(start);

    const speed = Math.floor(1000 * randInt(0, dynamic.maxSpikeFadeDistance) / fadeTime);
    const spikeVector = toVector({ angle, speed });
    const deltaX = originalVector.x + spikeVector.x;
    const deltaY = originalVector.y + spikeVector.y;
    const driftTween = getTweener(spike)
      .addFrame(fadeTime, {
        x1: spike.x1 + deltaX,
        y1: spike.y1 + deltaY,
        x2: spike.x2 + deltaX,
        y2: spike.y2 + deltaY,
        x3: spike.x3 + deltaX,
        y3: spike.y3 + deltaY,
      }, easeOut)
      .start(start);

    tweens.push(fadeTween, driftTween);
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

    const removeSpikesTween = getTweener(body)
      .addFrame(dynamic.maxSpikeFadeTime, { spikes: getOnCompleteTransformer([]) })
      .start(tick);
    tweens.push(removeSpikesTween);
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

    const fadeTween = getTweener(fill)
      .addFrame(fixed.bodyRemovalFadeTime, { a: 0 })
      .start(tick);
    const removeTween = getTweener(meta)
      .addFrame(dynamic.maxSpikeFadeTime, { isSimulated: false })
      .start(tick);

    tweens.push(fadeTween, removeTween);
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
  if (body.vitals.calories < body.vitals.spawnsAt || !body.meta.canInteract) {
    return [];
  }

  body.meta.canInteract = false;
  const children = [
    replicateParent(body, body.velocity.angle + 0.125),
    replicateParent(body, body.velocity.angle - 0.125),
  ];

  const swellTween = getTweener(body)
    .addFrame(fixed.spawnSwellTime, {
      radius: body.radius * fixed.spawnSwellFactor,
      fill: { a: 0 },
      spikes: body.spikes.map(() => ({ fill: { a: 0 } })),
      meta: { isSimulated: false },
    }, easeIn)
    .start(tick);
  tweens.push(swellTween);

  for (const child of children) {
    child.fill.a = 0;
    child.spikes.forEach(({ fill }) => { fill.a = 0; });
    child.meta.canInteract = false;

    const spawnTween = getTweener(child)
      .addFrame(fixed.bodySpawnInactiveTime, {
        fill: { a: 1 },
        spikes: child.spikes.map(() => ({ fill: { a: 1 } })),
        meta: { canInteract: true },
      }, easeOut)
      .start(tick + fixed.bodySpawnDelay);

    tweens.push(spawnTween);
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
 * Gets a function to calculate a "frame" of the simulation
 *
 * @param {Body[]} bodies - all the bodies to simulate
 * @param {number} start - the timestamp of the previous frame
 * @param {number} stop - the timestamp of the current frame
 * @returns {Body[]} - new array with inactive bodies removed
 */
export const simulateFrame = (bodies, start, stop) => {
  const delay = Math.min((stop - start) / 1000, MAX_TIME_PER_FRAME);

  const interactBodies = getBodyInteractor(bodies, delay, stop);
  const moveBody = getBodyMover(delay);
  const upkeepCalories = getCalorieUpkeeper(delay);
  const checkDeath = getDeathChecker(stop);
  const checkRemoval = getRemovalChecker(stop);
  const spawnChildren = getChildSpawner(stop);

  bodies.forEach(bounceWallIfPast);
  bodies.forEach(interactBodies);
  bodies.forEach(moveBody);
  bodies.forEach(upkeepCalories);
  bodies.forEach(adjustSaturation);
  bodies.forEach(checkDeath);
  bodies.forEach(checkRemoval);

  // Run tweens and remove if done
  tweens = tweens.filter(tween => tween(stop));

  const newMotes = bodies.length < dynamic.bodyLimit ? getNewMotes(delay) : [];
  const newChildren = flatMap(bodies, spawnChildren);

  return bodies
    .filter(({ meta }) => meta.isSimulated)
    .concat(newMotes, newChildren);
};
