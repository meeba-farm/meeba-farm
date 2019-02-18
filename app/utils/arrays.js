/**
 * Returns a new array with the numbers, i.e. [0, 1, ...len]
 *
 * @param {number} len - the length of the new array
 * @returns {number[]}
 */
export const range = len => Array(...Array(len)).map((_, i) => i);

/**
 * Takes an array returns a shallowly flattened copy
 *
 * @param {array} arr - the array to flatten
 * @returns {array}
 */
export const flatten = arr => arr.reduce((flat, nested) => flat.concat(nested), []);

/**
 * Creates a new 2D array split into evenly sized chunks
 *
 * @param {array} arr - the length of the new array
 * @param {number} size - the size of each chunk
 * @returns {array[]}
 */
export const chunk = (arr, size) => range(Math.ceil(arr.length / 2))
  .map(i => arr.slice(i * size, (i + 1) * size));

/**
 * Converts a hexadecimal string to a Uint8Array
 *
 * @param {string} hex - the hex string
 * @returns {Uint8Array}
 */
export const toBytes = hex => Uint8Array.from(
  chunk(hex.split(''), 2).map(byte => parseInt(byte.join(''), 16)),
);

/**
 * Converts a Uiny8Array into an uppercase hexadecimal string
 *
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export const toHex = bytes => Array.prototype.map.call(
  bytes,
  /**
   * @param {number} byte
   * @returns {string}
   */
  byte => byte.toString(16).padStart(2, '0').toUpperCase(),
).join('');