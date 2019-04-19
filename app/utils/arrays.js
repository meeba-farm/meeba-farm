import { thisFirst } from './functions.js';

export const map = thisFirst(Array.prototype.map);
export const filter = thisFirst(Array.prototype.filter);
export const reduce = thisFirst(Array.prototype.reduce);

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
 * @param {array} arr - the array to chunk
 * @param {number} size - the size of each chunk
 * @returns {array[]}
 */
export const chunk = (arr, size) => range(Math.ceil(arr.length / size))
  .map(i => arr.slice(i * size, (i + 1) * size));

/**
 * Finds the indexes of all items which match a predicate
 *
 * @param {array} arr - the array to search through
 * @param {function(any): boolean} predicate
 * @returns {number[]}
 */
export const findIndexes = (arr, predicate) => arr
  .map((item, i) => (predicate(item) ? i : -1))
  .filter(index => index !== -1);

/**
 * Creates a new 2D array based on a predicate which identifies which elements
 * should start a new chunk
 *
 * @param {array} arr - the array to chunk
 * @param {function(any): boolean} predicate
 * @returns {array[]}
 */
export const chunkBy = (arr, predicate) => {
  const rawIndexes = findIndexes(arr, predicate);
  const indexes = rawIndexes[0] === 0 ? rawIndexes : [0, ...rawIndexes];

  return indexes.map((index, i) => arr.slice(index, indexes[i + 1]));
};

/**
 * Groups the items in an array into sub-arrays by function output
 *
 * @param {array} arr - the array to group
 * @param {function} groupingFn - outputs how each item should be grouped
 * @returns {Object<string, array>}
 */
export const groupBy = (arr, groupingFn) => {
  /** @type {Object<string, array>} */
  const grouped = {};

  for (let i = 0; i < arr.length; i += 1) {
    const item = arr[i];
    const index = groupingFn(item, i, arr);

    if (!grouped[index]) {
      grouped[index] = [];
    }

    grouped[index].push(item);
  }

  return grouped;
};


/**
 * Concatenates any number of Uint8Arrays into a larger Uint8Array
 *
 * @param {...Uint8Array} byteArrays
 * @returns {Uint8Array}
 */
export const concatBytes = (...byteArrays) => {
  const length = byteArrays.reduce((sum, subArray) => sum + subArray.length, 0);
  const concatted = new Uint8Array(length);
  let offset = 0;

  for (const subArray of byteArrays) {
    concatted.set(subArray, offset);
    offset += subArray.length;
  }

  return concatted;
};

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
