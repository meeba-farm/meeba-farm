import * as settings from './settings.js';
import { createView, circleDrawer } from './view.js';
import { range } from './utils/arrays.js';

const VELOCITY = 200;

const view = createView({
  width: settings.tank.width,
  height: settings.tank.height
});
const drawCircle = circleDrawer(view);

const count = Math.floor(settings.tank.height / 3);
const circles = range(count).map((i) => ({
  id: `circle-${i}`,
  x: settings.tank.width / 2,
  y: 1 + 3 * i,
  radius: 2,
  fill: 'red',
  velocity: 0
}));

let lastTick = Date.now();
let frame = 0;

setInterval(() => {
  const thisTick = Date.now();
  const delay = thisTick - lastTick;
  lastTick = thisTick;
  frame++;

  circles
    .map((circle, i) => {
      if (circle.velocity === 0 && frame > i * 16) {
        circle.velocity = VELOCITY;
      }

      if (circle.x >= settings.tank.width - 2) {
        circle.velocity = -VELOCITY;
      }

      if (circle.x <= 2) {
        circle.velocity = VELOCITY;
      }

      circle.x += circle.velocity * delay / 1000;
      return circle;
    })
    .forEach(drawCircle);
}, 0);
