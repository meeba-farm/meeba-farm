import * as settings from './settings.js';
import {
  createView,
  getViewClearer,
  getCircleDrawer,
  getTriangleDrawer,
} from './view.js';
import {
  getRandomBody,
  separateBodies,
  simulateFrame,
} from './simulation.js';
import {
  range,
} from './utils/arrays.js';

const { width, height } = settings.tank;

const view = createView(width, height);
const clearView = getViewClearer(view, width, height);
const drawCircle = getCircleDrawer(view);
const drawTriangle = getTriangleDrawer(view);

let bodies = range(settings.simulation.bodies).map(getRandomBody);
separateBodies(bodies);

// Add bodies to window for debugging purposes (hack window type to allow this)
/** @type {Object<string, any>} */
const anyWindow = window;
anyWindow.bodies = bodies;

/** @param {number} lastTick */
const simulate = (lastTick) => {
  const thisTick = performance.now();
  bodies = simulateFrame(bodies, lastTick, thisTick);
  anyWindow.bodies = bodies;
  setTimeout(() => simulate(thisTick), 8);
};
const render = () => {
  clearView();
  bodies.forEach(body => body.spikes.forEach(drawTriangle));
  bodies.forEach(drawCircle);
  requestAnimationFrame(render);
};

// eslint-disable-next-line no-console
console.log('Simulating with seed:', settings.seed);
simulate(performance.now());
requestAnimationFrame(render);
