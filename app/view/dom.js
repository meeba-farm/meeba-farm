/**
 * Creates an HTMLElement with arbitrary attributes
 *
 * The short name makes it easy to nest calls, inspired by Mithril.js:
 * https://mithril.js.org/
 *
 * @param {string} tag - the type of element, i.e. 'div'
 * @param {object} attrs - the keys/values of attributes to set, i.e. { id: 'foo' }
 * @param {(HTMLElement|string)[]} children - children to append, if any
 * @returns {any}
 */
export const e = (tag, attrs, ...children) => {
  const elem = /** @type {any} */(document.createElement(tag)); // unfortunate TS workaround

  for (const [key, value] of Object.entries(attrs)) {
    elem[key] = value;
  }

  elem.append(...children);

  return elem;
};

/**
 * Finds an element by its id and if found, appends a child element to it
 *
 * @param {string} id
 * @param {HTMLElement|string} child - element or string to append
 */
export const appendById = (id, child) => {
  const container = document.getElementById(id);
  if (container) {
    container.append(child);
  }
};
