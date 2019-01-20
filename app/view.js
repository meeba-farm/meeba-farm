const VIEW_ID = 'view';

const createSvgElement = (tag) => {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
};

export const createView = ({ width, height }) => {
  const view = createSvgElement('svg');
  view.setAttribute('id', VIEW_ID);
  view.setAttribute('width', width);
  view.setAttribute('height', height);

  document.getElementById('app').appendChild(view);
  return view;
};

export const circleDrawer = (view) => ({ id, x, y, radius, fill }) => {
  const circle = document.getElementById(id) || createSvgElement('circle');

  if (!circle.getAttribute('id')) {
    circle.setAttribute('id', id);
    view.appendChild(circle);
  }

  circle.setAttribute('cx', x);
  circle.setAttribute('cy', y);
  circle.setAttribute('r', radius);
  circle.setAttribute('fill', fill);

  return circle;
};
