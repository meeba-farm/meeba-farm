import * as settings from './settings.js';
import { range } from './utils/arrays.js';
import { PI_2, getGap, rand, randInt } from './utils/math.js';
import {
  breakVector,
  bounceX,
  bounceY,
  hasCollided,
  collide
} from './utils/physics.js';

const MAX_ENERGY = 2 * settings.simulation.energy / settings.simulation.bodies;
const COLOR_RANGE = 256 * 256 * 256;
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
  body.meta.lastCollisionBody = null;

  return body;
};

const getMover = (delay) => (body) => {
  const { x, y } = breakVector(body.velocity);
  body.x += x * delay;
  body.y += y * delay;
}

const bounceIfOnWall = (body) => {
  const { x, y, radius, velocity: { angle } } = body;

  if (getGap(0, angle) < 0.25 && x > width - radius) {
    bounceX(body);
  } else if (getGap(0.25, angle) < 0.25 && y < radius) {
    bounceY(body);
  } else if (getGap(0.5, angle) < 0.25 && x < radius) {
    bounceX(body);
  } else if (getGap(0.75, angle) < 0.25 && y > height - radius) {
    bounceY(body);
  } else {
    return;
  }

  body.meta.lastCollisionBody = null;
};

// This O(n^2) implementation should eventually be replaced by a quadtree
const getBodyCollider = (bodies) => (body) => {
  bodies.forEach((other) => {
    const shouldCollide = body !== other
      && body.meta.lastCollisionBody !== other
      && hasCollided(body, other);

    if (shouldCollide) {
      collide(body, other);
      body.meta.lastCollisionBody = other;
      other.meta.lastCollisionBody = body;
    }
  })
}

export const getSimulator = (bodies) => (lastTick) => (thisTick) => {
  const delay = (thisTick - lastTick) / 1000;
  const collide = getBodyCollider(bodies);
  const move = getMover(delay);
  lastTick = thisTick;

  bodies.forEach(bounceIfOnWall);
  bodies.forEach(collide);
  bodies.forEach(move);
};
