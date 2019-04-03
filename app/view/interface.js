import { updateSetting } from '../settings.js';
import {
  button,
  header,
  row,
  title,
  settingInput,
  setting,
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

const sizeSettings = () => {
  const widthInput = settingInput('width', { size: 7 });
  const heightInput = settingInput('height', { size: 7 });

  return row(
    header('Tank Size'),
    widthInput,
    e('span', { style: { 'margin-right': '0.5em' } }, 'x'),
    heightInput,
    button('Set', () => {
      if (widthInput.value !== '') {
        updateSetting('width', widthInput.value);
        widthInput.value = '';
      }
      if (heightInput.value !== '') {
        updateSetting('height', heightInput.value);
        heightInput.value = '';
      }
    }),
  );
};

/**
 * Returns an HTML element with the entire user interface
 *
 * @param {MeebaFarmInterface} MeebaFarm
 * @returns {HTMLDivElement}
 */
export const getInterface = ({ pause, resume, reset }) => (
  e('div', { id: INTERFACE_ID },
    title('Meeba Farm'),
    row(
      button('Pause', pause),
      button('Resume', resume),
      button('Reset', reset),
    ),
    setting('seed', 'Seed'),
    sizeSettings(),
    setting('startingBodies', 'Initial Meeba Count'),
    setting('moteSpawnRate', 'Mote Spawn Rate'),
    setting('energy', 'Kinetic Energy'),
    setting('temperature', 'Tank Temperature'),
    setting('volatility', 'Gene Volatility'))
);
