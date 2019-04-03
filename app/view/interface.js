import {
  button,
} from './components.js';
import { e } from './dom.js';

/**
 * Object with methods for interacting with the simulation
 *
 * @typedef MeebaFarmInterface
 * @prop {function(): void} pause
 * @prop {function(): void} resume
 * @prop {function(): void} reset
 */

const INTERFACE_ID = 'interface';

/**
 * Returns an HTML element with the entire user interface
 *
 * @param {MeebaFarmInterface} MeebaFarm
 * @returns {HTMLDivElement}
 */
export const getInterface = ({ pause, resume, reset }) => (
  e('div', { id: INTERFACE_ID },
    e('h1', {}, 'Meeba Farm'),
    e('div', {},
      button('Pause', pause),
      button('Resume', resume),
      button('Reset', reset)))
);
