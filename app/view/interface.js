import { e } from './dom.js';

const INTERFACE_ID = 'interface';

/**
 * Returns an HTML element with the entire user interface
 *
 * @returns {HTMLDivElement}
 */
export const getInterface = () => (
  e('div', { id: INTERFACE_ID },
    e('h1', {}, 'Meeba Farm'))
);
