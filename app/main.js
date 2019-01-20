import * as settings from './settings.js';
import { createView, circleDrawer } from './view.js';

const view = createView({
  width: settings.tank.width,
  height: settings.tank.height
});
const drawCircle = circleDrawer(view);

drawCircle({
  x: settings.tank.width / 2,
  y: settings.tank.height / 2,
  radius: 50,
  fill: 'red'
});
