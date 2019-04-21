import {
  flatten,
} from './arrays.js';
import {
  roundRange,
} from './math.js';

/**
 * @callback Tweener
 *
 * @param {number} now - the current scaling value, for example a timestamp
 * @returns {boolean} done - whether or not the tween has finished
 */

/**
 * Checks if a value is an object
 *
 * @param {any} value - the value to test
 * @returns {boolean}
 */
export const isObject = value => typeof value === 'object' && value !== null;

/**
 * Checks if an object has keys
 *
 * @param {object} obj - the object to test
 * @returns {boolean}
 */
export const isEmpty = obj => Object.keys(obj).length === 0;

/**
 * Checks if an object, array, or other value has own property or index
 *
 * @param {any} value - the value to test
 * @param {string|number} key - the key or index to test
 * @returns {boolean}
 */
export const hasProp = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

/**
 * Recursively fetch a nested property from an object
 *
 * @param {any} obj - the object to fetch a property from
 * @param {string[]} path - the path to the nested property
 * @param {any} [defaultVal] - optional default value to return if property does not exist
 * @returns {any}
 */
export const getNested = (obj, path, defaultVal) => {
  if (path.length === 0) {
    return obj;
  }

  const [next, ...rest] = path;
  if (!hasProp(obj, next)) {
    return defaultVal;
  }

  return getNested(obj[next], rest, defaultVal);
};

/**
 * Recursively sets a nested property to a value
 *
 * @param {object} obj - the object to set a property of
 * @param {string[]} path - the path to the nested property
 * @param {any} value - the value to set
 */
export const setNested = (obj, path, value) => {
  const key = path[0];

  if (path.length === 1) {
    obj[key] = value;
  } else if (path.length > 1) {
    if (!isObject(obj[key])) {
      obj[key] = {};
    }
    setNested(obj[key], path.slice(1), value);
  }
};

/**
 * Recursively creates a sorted list of all keys in an object,
 * uses dot-separation for nested keys
 *
 * @param {object} obj
 * @param {string[]} [parentKeys]
 * @returns {string[]}
 */
export const listKeys = (obj, parentKeys = []) => {
  const nested = Object.entries(obj).map(([key, val]) => {
    const keyList = [...parentKeys, key];
    return isObject(val) && !isEmpty(val)
      ? listKeys(val, keyList)
      : keyList.join('.');
  });

  return flatten(nested).sort();
};

/**
 * Recursively lists all values in an object, following the same sorting as listKeys
 *
 * @param {object} obj
 * @returns {any[]}
 */
export const listValues = (obj) => {
  const keys = listKeys(obj);
  return keys.map(key => getNested(obj, key.split('.')));
};

/**
 * Returns a function which will mutate an object's properties over time
 *
 * @param {Object<string, any>} target - the object to mutate
 * @param {Object<string, any>} transform - the new properties and values
 * @param {number} start - the starting point, for example a timestamp
 * @param {number} duration - the length of the tween
 * @returns {Tweener} tween - progressively applies transforms
 */
export const getTweener = (target, transform, start, duration) => {
  let targetRef = /** @type {Object<string, any>|null} */ (target);
  const transforms = Object.entries(transform);

  const numbers = /** @type {{ key: string, original: number, diff: number }[]} */ (transforms
    .filter(([_, value]) => typeof value === 'number')
    .map(([key, final]) => {
      const original = target[key];
      return { key, original, diff: final - original };
    }));
  const others = /** @type {Array<[string, any]>} */ (transforms
    .filter(([_, value]) => typeof value !== 'number'));

  return (now) => {
    if (!targetRef) {
      return true;
    }

    const delta = roundRange((now - start) / duration, 0, 1);
    for (const { key, original, diff } of numbers) {
      targetRef[key] = original + delta * diff;
    }

    if (delta < 1) {
      return false;
    }

    for (const [key, value] of others) {
      targetRef[key] = value;
    }

    targetRef = null;
    return true;
  };
};
