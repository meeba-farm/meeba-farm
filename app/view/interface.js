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
import {
  e,
  withValue,
} from './dom.js';

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
      if (STRING_SETTINGS.has(selected)) {
        debugInput.type = 'text';
      } else {
        debugInput.type = 'number';
      }
    },
  }, ...debugKeys);

  return row(
    header('Experimental Debug Settings'),
    debugSelect,
    debugInput,
    button('Set', withValue(debugInput, value => updateSetting(selected, value))),
  );
};

const sizeSettings = () => {
  const widthInput = settingInput('width', { style: { width: '5em' } });
  const heightInput = settingInput('height', { style: { width: '5em' } });
  const setWidth = withValue(widthInput, value => updateSetting('width', value));
  const setHeight = withValue(heightInput, value => updateSetting('height', value));

  return row(
    header('Tank Size'),
    widthInput,
    e('span', { style: { 'margin-right': '0.5em' } }, 'x'),
    heightInput,
    button('Set', () => {
      setWidth();
      setHeight();
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
