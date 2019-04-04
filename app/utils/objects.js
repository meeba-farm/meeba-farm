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
 * Recursively fetch a nested property from an object
 *
 * @param {any} obj - the object to fetch a property from
 * @param {string[]} path - the path to the nested property
 * @returns {any}
 */
export const getNested = (obj, path) => {
  if (path.length === 0) {
    return obj;
  }
  if (!isObject(obj)) {
    return undefined;
  }
  return getNested(obj[path[0]], path.slice(1));
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
