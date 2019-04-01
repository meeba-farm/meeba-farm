/**
 * Recursively fetch a nested property from an object
 *
 * @param {any} obj - the object to fetch a property from
 * @param {string[]} path - the path to the nested property
 * @returns {any}
 */
// eslint-disable-next-line import/prefer-default-export
export const getNested = (obj, path) => {
  if (path.length === 0) {
    return obj;
  }
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  return getNested(obj[path[0]], path.slice(1));
};
