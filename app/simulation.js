import * as settings from './settings.js';
import { range } from './utils/arrays.js';

const VELOCITY = 200;

export const spawnBodies = (count) => {
  return range(count).map((i) => ({
    x: settings.tank.width / 2,
    y: 1 + 3 * i,
    radius: 2,
    fill: 'red',
    velocity: 0
  }));
}

export const getSimulator = (circles) => (lastTick) => (thisTick) => {
  const delay = thisTick - lastTick;
  lastTick = thisTick;

  circles.forEach((circle, i) => {
    if (circle.velocity === 0 && thisTick > i * 200 + 1500) {
      circle.velocity = VELOCITY;
    }

    if (circle.x >= settings.tank.width - 2) {
      circle.velocity = -VELOCITY;
    }

    if (circle.x <= 2) {
      circle.velocity = VELOCITY;
    }

    circle.x += circle.velocity * delay / 1000;
  });
};
