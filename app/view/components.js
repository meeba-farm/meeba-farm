import {
  settings,
  updateSetting,
  addUpdateListener,
} from '../settings.js';
import {
  e,
  withValue,
} from './dom.js';

/**
 * @typedef {import('../settings.js').CoreSettings} CoreSettings
 */

const { core } = settings;

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
  e('div', {},
    e('strong', {}, label))
);

/**
 * Returns a basic text input
 *
 * @param {string|number|boolean} placeholder
 * @param {object} [attrs] - may optionally specify additional styles and attributes
 * @returns {HTMLInputElement}
 */
export const input = (placeholder, { style = {}, ...attrs } = {}) => e('input', {
  placeholder,
  style: {
    'margin-right': '0.5em',
    ...style,
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

/**
 * Select element
 *
 * @param {string} label
 * @param {object} attrs
 * @param {string[]} options
 * @returns {HTMLSelectElement}
 */
export const select = (label, { style = {}, ...attrs }, ...options) => (
  e('select', { style: { 'margin-right': '0.5em', ...style }, ...attrs },
    e('option', { value: '' }, label),
    ...options.map(value => e('option', { value }, value)))
);

/**
 * Page title with reduced margins
 *
 * @param {string} label
 * @returns {HTMLHeadingElement}
 */
export const title = label => e('h1', {
  style: {
    'margin-block-start': 0,
    'margin-block-end': '0.25em',
  },
}, label);

// eslint-disable-next-line valid-jsdoc
/**
 * A live-updating text field tied to a core setting
 *
 * @param {keyof CoreSettings} key - the key of the core setting
 * @param {object} [attrs] - may optionally specify attributes
 * @returns {HTMLInputElement}
 */
export const settingInput = (key, attrs = {}) => {
  const inputRef = input(core[key], { type: 'number', ...attrs });
  addUpdateListener(() => {
    inputRef.placeholder = core[key].toString();
  });
  return inputRef;
};

// eslint-disable-next-line valid-jsdoc
/**
 * A complete row for updating a core setting
 *
 * @param {keyof CoreSettings} key
 * @param {string} label
 * @param {object} [inputAttrs] - may optionally specify additional input attributes
 * @returns {HTMLDivElement}
 */
export const setting = (key, label, inputAttrs = {}) => {
  const inputRef = settingInput(key, inputAttrs);

  return row(
    header(label),
    inputRef,
    button('Set', withValue(inputRef, value => updateSetting(key, value))),
  );
};
