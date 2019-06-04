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
  const others = /** @type {[string, string|boolean|null][]} */ (transforms
    .filter(([_, value]) => typeof value !== 'number'));

  return (current) => {
    if (!targetRef) {
      return false;
    }

    // Tween numbers
    const delta = roundRange((current - start) / duration, 0, 1);
    for (const { key, original, diff } of numbers) {
      targetRef[key] = original + delta * diff;
    }

    if (delta < 1) {
      return true;
    }

    // Tween other primitives only after delta has reached 1
    for (const [key, value] of others) {
      targetRef[key] = value;
    }

    targetRef = null;
    return false;
  };
};
