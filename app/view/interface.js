import {
  settings,
  updateSetting,
} from '../settings.js';
import {
  getNested,
  listKeys,
} from '../utils/objects.js';
import {
  button,
  header,
  input,
  row,
  select,
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
const STRING_SETTINGS = new Set(['core.seed', 'bodies.moteColor']);

const debugSettings = () => {
  let selected = '';
  const debugKeys = listKeys(settings).filter(key => key.slice(0, 5) !== 'core.');

  const debugInput = input('debug', '--', { style: { width: '5em' } });
  const debugSelect = select('Select Debug Setting...', {
    style: { width: '8em' },
    onchange: () => {
      selected = debugSelect.value;
      debugInput.placeholder = getNested(settings, selected.split('.'), '--');
    },
  }, ...debugKeys);

  const debugButton = button('Set', () => {
    const { value } = debugInput;
    if (value !== '') {
      if (STRING_SETTINGS.has(selected)) {
        updateSetting(selected, value);
      } else {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          updateSetting(selected, parsed);
        }
      }
      debugInput.placeholder = value;
      debugInput.value = '';
    }
  });

  return row(
    header('Experimental Debug Settings'),
    debugSelect,
    debugInput,
    debugButton,
  );
};

const sizeSettings = () => {
  const widthInput = settingInput('width', { style: { width: '5em' } });
  const heightInput = settingInput('height', { style: { width: '5em' } });

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
    setting('seed', 'Seed', { type: 'text' }),
    sizeSettings(),
    setting('startingBodies', 'Initial Meeba Count'),
    setting('moteSpawnRate', 'Mote Spawn Rate'),
    setting('energy', 'Kinetic Energy'),
    setting('temperature', 'Tank Temperature'),
    setting('volatility', 'Gene Volatility'),
    debugSettings())
);