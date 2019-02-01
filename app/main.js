import * as settings from './settings.js';
import { createView, getViewClearer, getCircleDrawer } from './view.js';
import { spawnBody, separateBodies, getSimulator } from './simulation.js';
import { range } from './utils/arrays.js';

const { width, height } = settings.tank;

const view = createView(width, height);
const clearView = getViewClearer(view, width, height);
const drawCircle = getCircleDrawer(view);

const bodies = range(settings.simulation.bodies).map(() => spawnBody());
separateBodies(bodies);

const simulate = getSimulator(bodies, performance.now());
const render = () => {
  clearView();
  bodies.forEach(drawCircle);
  requestAnimationFrame(render);
};

// eslint-disable-next-line no-console
console.log('Simulating with seed:', settings.seed);
setInterval(() => simulate(performance.now()), 8);
requestAnimationFrame(render);
