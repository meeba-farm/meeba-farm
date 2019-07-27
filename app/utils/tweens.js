import {
  flatMap,
} from './arrays.js';
import {
  pipe,
} from './functions.js';
import {
  roundRange,
} from './math.js';
import {
  isObject,
  getNested,
  setNested,
} from './objects.js';

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
 * @callback FrameCallback
 *
 * @param {number} [delta] - current delta from 0 to 1
 * @param {Object<string, any>} [target] - object being mutated
 */

/**
 * @callback FrameUpdater
 *
 * @param {number} delta - current delta from 0 to 1
 */

/**
 * @callback TimedCallback
 *
 * @param {number} [current] - the current value being tweened with (i.e. timestamp)
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
 * @param {number} [start] - starting point, typically a timestamp, set on first tween if omitted
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
 * @param {string[]} path - path of the nested property in the target
 * @param {Object<string, any>} target - object being mutated
 * @returns {function(PropTransformer): function(number): void}
 */
const getTransformCaller = (base, path, target) => (transform) => (delta) => {
  const key = path[path.length - 1];
  const transformed = transform(delta, base, key, target);

  setNested(target, path, transformed);
};

/**
 * Parses a transform object into a series of functions, which when called with a
 * delta will transform an individual property using enclosed values
 *
 * @param {Object<string, any>} target - the object being mutated
 * @param {Object<string, any>|FrameCallback} transform - the transform object or function
 * @param {string[]} [parents] - keys of parent properties
 * @returns {FrameUpdater}
 */
const parseTransform = (target, transform, parents = []) => {
  if (typeof transform === 'function') {
    return (delta) => {
      transform(delta, target);
    };
  }

  const propTransforms = flatMap(Object.entries(transform), ([key, prop]) => {
    const path = [...parents, key];

    if (isObject(prop)) {
      return parseTransform(target, prop, path);
    }

    const base = getNested(target, path);
    const callTransformer = getTransformCaller(base, path, target);

    if (typeof prop === 'function') {
      return callTransformer(prop);
    }

    if (typeof prop === 'number') {
      return callTransformer(getNumberTransformer(prop - base));
    }

    return callTransformer(getOnCompleteTransformer(prop));
  });

  return (delta) => {
    for (const propTransform of propTransforms) {
      propTransform(delta);
    }
  };
};

/**
 * Builds the final tween function from a target object, a series of key frames,
 * and an optional initial start value
 *
 * @param {Object<string, any>} target - the object to mutate
 * @param {TweenFrame[]} frames - the frames already added
 * @param {number} [firstStart] - the initial start value, typically a timestamp,
 *                                set on first tween if omitted
 * @returns {Tweener} tween
 */
const buildTweener = (target, frames, firstStart) => {
  const frameStack = frames.slice().reverse();

  /**
  * Enclosing a nullable reference to the target
  * @type {Object<string, any>|null}
  */
  let targetRef = target;

  let duration = 0;
  let start = firstStart;

  /** @type {Easer} */
  let ease;

  /** @type {FrameUpdater|null} */
  let updateFrame = null;


  return /** @type {Tweener} */ function tween(current) {
    if (!targetRef) {
      return false;
    }

    if (start === undefined) {
      start = current;
    }

    if (updateFrame) {
      const delta = pipe((current - start) / duration)
        .into(roundRange, 0, 1)
        .into(ease)
        .done();
      updateFrame(delta);
    }

    if (current < start + duration) {
      // More to go in the current frame
      return true;
    }

    const nextFrame = frameStack.pop();
    if (nextFrame) {
      // Time for next frame, update closure variables and run again
      start += duration;
      ({ duration, ease } = nextFrame);
      updateFrame = parseTransform(targetRef, nextFrame.transform);
      return tween(current);
    }

    // No more frames, clean up references so they can be garbage collected
    targetRef = null;
    ease = easeLinear;
    updateFrame = null;

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

/**
 * Creates a tweener that replicates the behavior of setTimeout, calling a callback
 * after a certain start value is reached
 *
 * @param {TimedCallback} callback - a function to call once the start is reached
 * @param {number} delay - wait before triggering the callback
 * @returns {Tweener}
 */
export const getTimeout = (callback, delay) => {
  /**
  * Enclosing a nullable reference to the callback
  * @type {TimedCallback|null}
  */
  let callbackRef = callback;

  /** @type {number} */
  let start;

  return function timeout(current) {
    if (!callbackRef) {
      return false;
    }

    if (start === undefined) {
      start = current + delay;
    }

    if (current >= start) {
      callbackRef(current);
      callbackRef = null;
      return false;
    }

    return true;
  };
};

/**
 * Creates a tweener that replicates the behavior of setInterval, repeatedly calling
 * a callback each time a duration is passed
 *
 * @param {TimedCallback} callback - a function to call once the start is reached
 * @param {number} duration - how long each interval should last
 * @returns {Tweener}
 */
export const getInterval = (callback, duration) => {
  /** @type {number} */
  let next;

  return function interval(current) {
    if (next === undefined) {
      next = current + duration;
    }

    if (current >= next) {
      next += duration;
      callback(current);
      interval(current);
    }

    return true;
  };
};
