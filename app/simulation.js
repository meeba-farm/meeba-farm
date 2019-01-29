import * as settings from './settings.js';
import { range } from './utils/arrays.js';
import {
  PI_2,
  getGap,
  isShorter,
  rand,
  randInt
} from './utils/math.js';
import {
  breakVector,
  bounceX,
  bounceY,
  collide
} from './utils/physics.js';

const MAX_ENERGY = 2 * settings.simulation.energy / settings.simulation.bodies;
const COLOR_RANGE = 256 * 256 * 256;
const COLLISION_BUFFER = 3;

const { minRadius, maxRadius } = settings.meebas;
const { width, height } = settings.tank;

const randFill = () => {
  const fullFill = '000000' + randInt(0, COLOR_RANGE).toString(16);
  return '#' + fullFill.slice(-6);
}

// Creates a new body to simulate
// Optionally reuses the ref to an old body to avoid garbage collection
export const spawnBody = (body = { velocity: {}, meta: {} }) => {
  body.radius = randInt(minRadius, maxRadius);
  body.mass = Math.floor(PI_2 * body.radius);

  body.x = randInt(body.radius, width - body.radius);
  body.y = randInt(body.radius, height - body.radius);

  body.velocity.angle = rand();
  body.velocity.speed = randInt(0, MAX_ENERGY / body.mass);

  body.fill = randFill();
  body.meta.nextX = null;
  body.meta.nextY = null;
  body.meta.lastCollisionBody = null;

  return body;
};

const getMoveCalulator = (delay) => (body) => {
  const { x, y } = breakVector(body.velocity);
  body.meta.nextX = body.x + x * delay;
  body.meta.nextY = body.y + y * delay;
};

const moveBody = (body) => {
  body.x = body.meta.nextX;
  body.y = body.meta.nextY;
  body.meta.nextX = null;
  body.meta.nextY = null;
};

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

  getMoveCalulator(delay)(body);
  body.meta.lastCollisionBody = null;
};

// True if the length between the centers is shorter than the sum of the radii
const isOverlapping = (body1, body2) => {
  return isShorter({
    x1: body1.x,
    y1: body1.y,
    x2: body2.x,
    y2: body2.y
  }, body1.radius + body2.radius + COLLISION_BUFFER);
};
const willOverlap = (body1, body2) => {
  return isShorter({
    x1: body1.meta.nextX,
    y1: body1.meta.nextY,
    x2: body2.meta.nextX,
    y2: body2.meta.nextY
  }, body1.radius + body2.radius + COLLISION_BUFFER);
};

// This O(n^2) implementation should eventually be replaced by a quadtree
const getBodyCollider = (bodies, delay) => (body) => {
  bodies.forEach((other) => {
    const shouldCollide = body !== other
      && body.meta.lastCollisionBody !== other
      && (isOverlapping(body, other) || willOverlap(body, other));

    if (shouldCollide) {
      collide(body, other);
      getMoveCalulator(delay)(body);
      body.meta.lastCollisionBody = other;
      other.meta.lastCollisionBody = body;
    }
  });
};

export const getSimulator = (bodies, lastTick) => (thisTick) => {
  const delay = (thisTick - lastTick) / 1000;
  lastTick = thisTick;

  const calcMove = getMoveCalulator(delay);
  const bounce = getWallBouncer(delay);
  const collide = getBodyCollider(bodies, delay);

  bodies.forEach(calcMove);
  bodies.forEach(bounce);
  bodies.forEach(collide);
  bodies.forEach(moveBody)
};
