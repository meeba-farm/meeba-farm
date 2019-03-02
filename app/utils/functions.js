/**
 * @callback Into
 * @param {any} operand - value to pipe into a function
 * @param {...any} [args] - additional arguments to apply to function
 * @returns Pipeable
 */

/**
 * @typedef Pipeable
 * @prop {Into} into - pipes the value into a new function
 * @prop {function(): any} done - breaks the chain, returning the final value
 */

/**
 * Allows a chain of functions to be built using an `into` method to pass in the
 * next function. Use the `done` method to complete the chain and return the value
 *
 * @param {any} operand - the value to pipe
 * @returns {Pipeable}
 */
export const pipe = operand => ({
  into: (fn, ...args) => pipe(fn(operand, ...args)),
  done: () => operand,
});
