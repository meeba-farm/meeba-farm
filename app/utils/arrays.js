/**
 * Returns a new array with the numbers, i.e. [0, 1, ...len]
 *
 * @param {number} len - the length of the new array
 * @returns {number[]}
 */
// eslint-disable-next-line import/prefer-default-export
export const range = len => Array(...Array(len)).map((_, i) => i);
