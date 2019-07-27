/**
 * @callback FrameRunner
 * @param {number} [tick] - timestamp of current frame of the loop in ms
 * @param {number} [delay] - time elapsed since the last frame
 */

/**
 * @typedef LoopControls
 * @prop {function(): void} start - begin the loop or resume if paused
 * @prop {function(): void} stop - pause loop execution and timestamp incrementing
 * @prop {function(): void} reset - reset the timestamp to zero
 */

/**
 * Takes a callback to be run on each frame and creates a loop with requestAnimationFrame.
 * Returns an object with three control methods to start, stop, and reset the loop
 *
 * @param {FrameRunner} onFrame - callback to be run on each frame
 * @returns {LoopControls}
 */
export const createLoop = (onFrame) => {
  let isRunning = false;
  let lastFrame = 0;
  let lastStopped = 0;
  let stoppedTime = 0;

  /** @param {number} timestamp */
  const loop = (timestamp) => {
    if (isRunning) {
      onFrame(timestamp - stoppedTime, timestamp - lastFrame);
      lastFrame = timestamp;
      requestAnimationFrame(loop);
    }
  };

  const start = () => {
    if (!isRunning) {
      isRunning = true;
      requestAnimationFrame((timestamp) => {
        lastFrame = timestamp;
        stoppedTime += timestamp - lastStopped;
        requestAnimationFrame(loop);
      });
    }
  };

  const stop = () => {
    if (isRunning) {
      isRunning = false;
      lastStopped = lastFrame;
    }
  };

  const reset = () => {
    stoppedTime = lastFrame;
  };

  return { start, stop, reset };
};
