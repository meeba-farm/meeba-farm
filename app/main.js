import * as settings from './settings.js';
import { createView, viewClearer, circleDrawer } from './view.js';
import { spawnBodies, getSimulator } from './simulation.js';
import { range } from './utils/arrays.js';

const view = createView({
  width: settings.tank.width,
  height: settings.tank.height
});
const clearView = viewClearer(view, settings.tank.width, settings.tank.height);
const drawCircle = circleDrawer(view);

const count = Math.floor(settings.tank.height / 3);
const circles = spawnBodies(count);
const simulate = getSimulator(circles)(performance.now());

const render = () => {
  clearView();
  circles.forEach(drawCircle);
  requestAnimationFrame(render);
};

console.log('Simulating with seed:', settings.seed);
setInterval(() => simulate(performance.now()), 8);
requestAnimationFrame(render);
