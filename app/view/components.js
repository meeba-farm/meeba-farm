import {
  settings,
  updateSetting,
  addUpdateListener,
} from '../settings.js';
import {
  e,
  setById,
} from './dom.js';

/**
 * @typedef {import('../settings.js').CoreSettings} CoreSettings
 */

/** @type {(keyof CoreSettings)[]} */
const settingsToUpdate = [];

const { core } = settings;
addUpdateListener(() => {
  for (const setting of settingsToUpdate) {
    setById(setting, 'placeholder', core[setting]);
  }
});

/**
 * Returns a basic button element with an onclick listener
 *
 * @param {string} label
 * @param {function([Event]): void} onclick
 * @returns {HTMLButtonElement}
 */
export const button = (label, onclick = () => {}) => e('button', {
  onclick,
  style: {
    'margin-right': '0.5em',
  },
}, label);

/**
 * Returns a new canvas element
 *
 * @param {string} id
 * @param {number} width
 * @param {number} height
 * @returns {HTMLCanvasElement}
 */
export const canvas = (id, width, height) => e('canvas', { id, width, height });

/**
 * A header with a modest bottom margin
 *
 * @param {string} label
 * @returns {HTMLDivElement}
 */
export const header = label => (
  e('div', { 'margin-bottom': '0.5em' },
    e('strong', {}, label))
);

/**
 * Returns a basic text input
 *
 * @param {string} id
 * @param {string|number|boolean} placeholder
 * @param {object} [attrs] - may optionally specify additional attributes
 * @returns {HTMLInputElement}
 */
export const input = (id, placeholder, attrs = {}) => e('input', {
  id,
  placeholder,
  style: {
    'margin-right': '0.5em',
  },
  ...attrs,
});

/**
 * Just a div with a bit of a margin on the bottom
 *
 * @param {(HTMLElement|string)[]} children
 * @returns {HTMLDivElement}
 */
export const row = (...children) => e('div', {
  style: {
    'margin-bottom': '1em',
  },
}, ...children);

// eslint-disable-next-line valid-jsdoc
/**
 * A live-updating text field tied to a core setting
 *
 * @param {keyof CoreSettings} key - the key of the core setting
 * @param {object} [attrs] - may optionally specify attributes
 * @returns {HTMLInputElement}
 */
export const settingInput = (key, attrs = {}) => {
  settingsToUpdate.push(key);
  return input(key, core[key], attrs);
};

// eslint-disable-next-line valid-jsdoc
/**
 * A complete row for updating a core setting
 *
 * @param {keyof CoreSettings} key
 * @param {string} label
 * @returns {HTMLDivElement}
 */
export const setting = (key, label) => {
  const inputRef = settingInput(key);

  return row(
    header(label),
    inputRef,
    button('Set', () => {
      if (inputRef.value !== '') {
        updateSetting(key, inputRef.value);
        inputRef.value = '';
      }
    }),
  );
};
