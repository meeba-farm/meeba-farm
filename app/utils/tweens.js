import {
  pipe,
} from './functions.js';
import {
  roundRange,
} from './math.js';

/**
 * @callback Easer
 *
 * @param {number} delta - current delta from 0 to 1
 * @returns {number} - adjusted delta, still between 0 to 1
 */

/**
 * @callback Tweener
 *
 * @param {number} now - the current scaling value, for example a timestamp
 * @returns {boolean} more - whether or not there is more to transform
 */

/**
 * @typedef TweenBuilder
 *
 * @prop {AddFrame} addFrame - method for adding new frames
 * @prop {StartTween} start - returns the final tween function
 */

/**
 * @callback AddFrame
 *
 * @param {number} duration - the duration for the frame
 * @param {Object<string, any>} transform - the new properties and values
 * @param {Easer} [ease] - a function to ease the delta, defaults to linear
 * @returns {TweenBuilder}
 */

/**
 * @callback StartTween
 *
 * @param {number} start - the starting point, typically timestamp
 * @returns {Tweener} tween - progressively applies transforms
 */

/**
 * @typedef TweenFrame
 *
 * @prop {number} duration - the duration for the frame
 * @prop {Object<string, any>} transform - the new properties and values
 * @prop {Easer} ease - a function to ease the delta
 */

/**
 * @typedef NumberTransform
 *
 * @prop {string} key - the property to transform
 * @prop {number} original - the original value of the number
 * @prop {number} diff - the difference between the final value and the original
 */

/**
 * @typedef OtherTransform
 *
 * @prop {string} key - the property to transform
 * @prop {any} final - the final value for the property
 */

/**
 * Identity function, creates the default linear ease
 *
 * @param {number} delta - current delta from 0 to 1
 * @returns {number}
 */
export const easeLinear = delta => delta;

/**
 * Creates an "ease in", where change begins slowly before catching up
 *
 * Credit to @edelventhal for the easing logic: github.com/edelventhal
 *
 * @param {number} delta - current delta from 0 to 1
 * @returns {number}
 */
export const easeIn = delta => delta * delta;

/**
 * Creates an "ease out", where change starts quickly and then slows before end
 *
 * Credit to @edelventhal for the easing logic: github.com/edelventhal
 *
 * @param {number} delta - current delta from 0 to 1
 * @returns {number}
 */
export const easeOut = delta => -delta * (delta - 2);

/**
 * Parses a transform object into individual property transforms, divided into numbers and others
 *
 * @param {Object<string, any>} target - the object being mutated
 * @param {Object<string, any>} transform - the transform object
 * @returns {{ numbers: NumberTransform[], others: OtherTransform[] }}
 */
const parseTransform = (target, transform) => {
  const propTransforms = Object.entries(transform);

  const numbers = propTransforms
    .filter(([_, value]) => typeof value === 'number')
    .map(([key, final]) => {
      const original = target[key];
      return { key, original, diff: final - original };
    });
  const others = propTransforms
    .filter(([_, value]) => typeof value !== 'number')
    .map(([key, final]) => ({ key, final }));

  return { numbers, others };
};

/**
 * Apply mutations for transform properties based on a delta
 *
 * @param {Object<string, any>} target - the object to mutate
 * @param {NumberTransform[]} numbers - number properties to transform
 * @param {OtherTransform[]} others - other properties to transform
 * @param {number} delta - the degree of change, from 0 to 1
 */
const tweenProps = (target, numbers, others, delta) => {
  for (const { key, original, diff } of numbers) {
    target[key] = original + delta * diff;
  }

  if (delta === 1) {
    for (const { key, final } of others) {
      target[key] = final;
    }
  }
};

/**
 * Builds the final tween function from a target object, a series of key frames,
 * and an initial start value
 *
 * @param {Object<string, any>} target - the object to mutate
 * @param {TweenFrame[]} frames - the frames already added
 * @param {number} firstStart - the initial start value, typically a timestamp
 * @returns {Tweener} tween
 */
const buildTweener = (target, frames, firstStart) => {
  const frameStack = frames.slice().reverse();
  const firstFrame = frameStack.pop();

  if (!firstFrame) {
    throw new Error('Invalid tween function: must add at least one frame');
  }

  let targetRef = /** @type {Object<string, any>|null} */ (target);
  let start = firstStart;
  let { duration, transform, ease } = firstFrame;
  let { numbers, others } = parseTransform(target, transform);

  return /** @type {Tweener} */ function tween(current) {
    if (!targetRef) {
      return false;
    }

    const delta = pipe((current - start) / duration)
      .into(roundRange, 0, 1)
      .into(ease)
      .done();
    tweenProps(target, numbers, others, delta);

    if (current < start + duration) {
      // More to go in the current frame
      return true;
    }

    const nextFrame = frameStack.pop();
    if (!nextFrame) {
      // No more frames, toss target reference so it can be garbage collected
      targetRef = null;
      return false;
    }

    // Time for next frame, update closure variables and run again
    start += duration;
    ({ duration, transform, ease } = nextFrame);
    ({ numbers, others } = parseTransform(targetRef, transform));
    return tween(current);
  };
};

/**
 * Gets a builder object to create a tweener function
 *
 * @param {Object<string, any>} target - the object to mutate
 * @param {TweenFrame[]} frames - the frames already added
 * @returns {TweenBuilder}
 */
const getTweenBuilder = (target, frames) => ({
  addFrame: (duration, transform, ease = easeLinear) => (
    getTweenBuilder(target, [...frames, { duration, transform, ease }])
  ),

  start: start => buildTweener(target, frames, start),
});

/**
 * Uses the builder pattern to create a tweening function which can mutate
 * a target object's top-level properties over multiple key frames
 *
 * See tweens.test.js for example usage
 *
 * @param {Object<string, any>} target - the object to mutate
 * @returns {TweenBuilder}
 */
export const getTweener = target => getTweenBuilder(target, []);
