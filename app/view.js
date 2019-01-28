import { PI_2 } from './utils/math.js';

const VIEW_ID = 'view';

export const createView = ({ width, height }) => {
  const view = document.createElement('canvas');
  view.setAttribute('id', VIEW_ID);
  view.setAttribute('width', width);
  view.setAttribute('height', height);

  document.getElementById('app').appendChild(view);
  return view;
};

export const viewClearer = (view, width, height) => () => {
  const ctx = view.getContext('2d');
  ctx.clearRect(0, 0, width, height);
};

export const circleDrawer = (view) => ({ x, y, radius, fill }) => {
  const ctx = view.getContext('2d');

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, PI_2);
  ctx.fillStyle = fill;
  ctx.fill();
};
