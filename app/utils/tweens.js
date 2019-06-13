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
 * @callback PropTransformer
 *
 * @param {number} [delta] - current delta from 0 to 1
 * @param {any} [base] - value of property as of the previous frame or start
 * @param {string} [key] - key of the property
 * @param {Object<string, any>} [target] - object being mutated
 * @returns {any} the new value to set at that property
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
 * Takes the difference between the original and final value of a number and returns
 * a transform function for it
 *
 * @param {number} diff - amount to change the number
 * @returns {PropTransformer}
 */
export const getNumberTransformer = (diff) => (delta, base) => base + delta * diff;

/**
 * Takes a final value and returns a function which only returns the value after
 * a delta of 1 is reached
 *
 * @param {any} final - value of the property at the end of the frame
 * @returns {PropTransformer}
 */
export const getOnCompleteTransformer = (final) => (delta, base) => (delta < 1 ? base : final);

/**
 * Builds a function which will set a property based the return value of a transform function
 *
 * @param {any} base - value of property as of the previous frame or start
 * @param {string} key - key of the property
 * @param {Object<string, any>} target - object being mutated
 * @returns {function(PropTransformer): function(number): void}
 */
const getTransformCaller = (base, key, target) => (transform) => (delta) => {
  target[key] = transform(delta, base, key, target);
};

/**
 * Parses a transform object into a series of functions, which when called with a
 * delta will transform an individual property using enclosed values
 *
 * @param {Object<string, any>} target - the object being mutated
 * @param {Object<string, any>} transform - the transform object
 * @returns {PropTransformer[]}
 */
const parseTransform = (target, transform) => Object.entries(transform)
  .map(([key, prop]) => {
    const base = target[key];
    const callTransformer = getTransformCaller(base, key, target);

    if (typeof prop === 'function') {
      return callTransformer(prop);
    }

    if (typeof prop === 'number') {
      return callTransformer(getNumberTransformer(prop - base));
    }

    return callTransformer(getOnCompleteTransformer(prop));
  });

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

  /**
  * Enclosing a nullable reference to the target
  * @type {Object<string, any>|null}
  */
  let targetRef = target;

  let start = firstStart;
  let { duration, transform, ease } = firstFrame;
  let propTransforms = parseTransform(target, transform);

  return /** @type {Tweener} */ function tween(current) {
    if (!targetRef) {
      return false;
    }

    const delta = pipe((current - start) / duration)
      .into(roundRange, 0, 1)
      .into(ease)
      .done();

    for (const transformEnclosedProp of propTransforms) {
      transformEnclosedProp(delta);
    }

    if (current < start + duration) {
      // More to go in the current frame
      return true;
    }

    const nextFrame = frameStack.pop();
    if (nextFrame) {
      // Time for next frame, update closure variables and run again
      start += duration;
      ({ duration, transform, ease } = nextFrame);
      propTransforms = parseTransform(targetRef, transform);
      return tween(current);
    }

    // No more frames, clean up references so they can be garbage collected
    targetRef = null;
    transform = {};
    ease = easeLinear;
    propTransforms = [];

    return false;
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
