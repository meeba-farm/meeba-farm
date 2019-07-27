'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const {
  createLoop,
} = require('./loop.common.js');

describe('Game loop utils', () => {
  describe('createLoop', () => {
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    it('should take a callback function and return control methods', () => {
      const controls = createLoop(() => {});

      expect(controls).to.be.an('object');
      expect(controls.start).to.be.a('function');
      expect(controls.stop).to.be.a('function');
      expect(controls.reset).to.be.a('function');
    });

    it('should call callback each frame with timestamp and time since the last frame', () => {
      const callback = sinon.spy();
      const { start } = createLoop(callback);

      start();
      clock.tick(1000);
      expect(callback).to.have.been.called;

      const [tick, delay] = callback.lastCall.args;
      expect(tick).to.be.a('number').within(900, 1000);
      expect(delay).to.be.a('number').lessThan(100);
    });

    it('should start and stop the loop', () => {
      const callback = sinon.spy();
      const { start, stop } = createLoop(callback);

      start();
      clock.tick(1000);
      expect(callback).to.have.been.called;

      const { callCount } = callback;

      stop();
      clock.tick(1000);
      expect(callback.callCount).to.equal(callCount);

      start();
      clock.tick(1000);
      expect(callback.callCount).to.be.greaterThan(callCount);
    });

    it('should reset the timestamp', () => {
      const callback = sinon.spy();
      const { start, reset } = createLoop(callback);

      start();
      clock.tick(1000);
      const [preResetTick] = callback.lastCall.args;

      reset();
      clock.tick(100);
      const [postResetTick] = callback.lastCall.args;

      expect(postResetTick).to.be.lessThan(preResetTick);
    });
  });
});
