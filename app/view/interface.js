import {
  settings,
  updateSetting,
  getSavedSettings,
  loadSettings,
  restoreDefaultSettings,
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

const BLURB = [
  'An evolving life simulation with simple mutating creatures called "meebas", each',
  'with their own unique DNA. Modify the environmental settings below to see how',
  'it changes the meeba species that emerge through natural selection.',
].join(' ');
const TOOL_TIPS = {
  SEED: 'Specify a seed to ensure the same initial population spawns each reset',
  TANK_SIZE: 'The height and width of the meeba tank in pixels',
  INITIAL_COUNT: 'How many meebas to start each simulation with',
  MOTE_RATE: 'How many motes (food pellets) appear in the tank each second',
  ENERGY: 'How fast everything bounces around',
  TEMPERATE: 'A warmer tank increases meeba metabolism, they will feed and die faster',
  VOLATILITY: 'The more volatile meeba genes, the more mutations their children will inherit',
  DEBUG: 'Warning! These internal simulation settings can have extreme affects',
  LOAD: 'Copy this text string to share your settings, paste to load saved settings',
};

const debugSettings = () => {
  let selected = '';
  const debugKeys = listKeys(settings).filter(key => key.slice(0, 5) !== 'core.');

  const debugInput = input('--', { style: { width: '5em' } });
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
    header('Debug Settings', { title: TOOL_TIPS.DEBUG }),
    debugSelect,
    debugInput,
    button('Set', withValue(debugInput, (value) => {
      updateSetting(selected, value);
      debugInput.placeholder = value;
    })),
  );
};

const sizeSettings = () => {
  const widthInput = settingInput('width', { style: { width: '5em' } });
  const heightInput = settingInput('height', { style: { width: '5em' } });
  const setWidth = withValue(widthInput, value => updateSetting('width', value));
  const setHeight = withValue(heightInput, value => updateSetting('height', value));

  return row(
    header('Tank Size', { title: TOOL_TIPS.TANK_SIZE }),
    widthInput,
    e('span', { style: { 'margin-right': '0.5em' } }, 'x'),
    heightInput,
    button('Set', () => {
      setWidth();
      setHeight();
    }),
  );
};

const settingsLoader = () => {
  const saveStringInput = e('textarea', {
    placeholder: 'Click "Get" to retrieve saved settings,\nclick "Load" to load new settings...',
    rows: 5,
    style: { width: '95%' },
  });

  return row(
    header('Save/Load Settings', { title: TOOL_TIPS.LOAD }),
    saveStringInput,
    button('Get', () => {
      saveStringInput.value = getSavedSettings() || '';
    }),
    button('Load', withValue(saveStringInput, loadSettings)),
    button('Restore Defaults', restoreDefaultSettings),
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
    row(e('p', {}, BLURB)),
    setting('seed', 'Seed', TOOL_TIPS.SEED, { type: 'text' }),
    sizeSettings(),
    setting('startingMeebaCount', 'Initial Meeba Count', TOOL_TIPS.INITIAL_COUNT),
    setting('moteSpawnRate', 'Mote Spawn Rate', TOOL_TIPS.MOTE_RATE),
    setting('energy', 'Kinetic Energy', TOOL_TIPS.ENERGY),
    setting('temperature', 'Tank Temperature', TOOL_TIPS.TEMPERATE),
    setting('volatility', 'Gene Volatility', TOOL_TIPS.VOLATILITY),
    debugSettings(),
    settingsLoader(),
    e('div', { style: { 'margin-top': '2em' } },
      e('small', {},
        e('em', {},
          e('div', { style: { 'margin-bottom': '0.25em' } }, 'Written with vanilla JS by ',
            e('a', { href: 'https://github.com/delventhalz' }, 'Zac Delventhal')),
          e('div', {}, 'Learn more and report issues on ',
            e('a', { href: 'https://github.com/meeba-farm/meeba-farm' }, 'GitHub'))))))
);
