'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const {
  easeLinear,
  easeIn,
  easeOut,
  getNumberTransformer,
  getOnCompleteTransformer,
  getTweener,
  getTimeout,
  getInterval,
} = require('./tweens.common.js');

describe('Tweening utils', () => {
  describe('easeLinear', () => {
    it('should return 0 when passed 0', () => {
      expect(easeLinear(0)).to.equal(0);
    });

    it('should return 1 when passed 1', () => {
      expect(easeLinear(1)).to.equal(1);
    });

    it('should return 0.5 when passed 0.5', () => {
      expect(easeLinear(0.5)).to.equal(0.5);
    });
  });

  describe('easeIn', () => {
    it('should return 0 when passed 0', () => {
      expect(easeIn(0)).to.equal(0);
    });

    it('should return 1 when passed 1', () => {
      expect(easeIn(1)).to.equal(1);
    });

    it('should return less than 0.5 when passed 0.5', () => {
      expect(easeIn(0.5)).to.be.lessThan(0.5);
    });
  });

  describe('easeOut', () => {
    it('should return 0 when passed 0', () => {
      expect(easeOut(0)).to.equal(0);
    });

    it('should return 1 when passed 1', () => {
      expect(easeOut(1)).to.equal(1);
    });

    it('should return greater than 0.5 when passed 0.5', () => {
      expect(easeOut(0.5)).to.be.greaterThan(0.5);
    });
  });

  describe('getNumberTransformer', () => {
    it('should take a numerical difference and return a function', () => {
      expect(getNumberTransformer(4)).to.be.a('function');
    });

    it('should progressively add a difference based on a delta', () => {
      const tweenFour = getNumberTransformer(4);

      expect(tweenFour(0, 10)).to.equal(10);
      expect(tweenFour(0.25, 10)).to.equal(11);
      expect(tweenFour(0.5, 10)).to.equal(12);
      expect(tweenFour(1, 10)).to.equal(14);
    });
  });

  describe('getOnCompleteTransformer', () => {
    it('should take a final value and return a function', () => {
      expect(getOnCompleteTransformer('foo')).to.be.a('function');
    });

    it('should return the base value when the delta is less than one', () => {
      const fooOnComplete = getOnCompleteTransformer('foo');

      expect(fooOnComplete(0, 'bar')).to.equal('bar');
      expect(fooOnComplete(0.25, 'bar')).to.equal('bar');
      expect(fooOnComplete(0.5, 'bar')).to.equal('bar');
    });

    it('should return the final value when the delta is one', () => {
      const fooOnComplete = getOnCompleteTransformer('foo');
      expect(fooOnComplete(1, 'bar')).to.equal('foo');
    });
  });

  describe('getTweener', () => {
    describe('basic functionality', () => {
      it('should take an object and return a wrapper with chainable methods', () => {
        const chainable = getTweener({ foo: 1 });

        expect(chainable).to.be.an('object');
        expect(chainable.addFrame).to.be.a('function');
        expect(chainable.start).to.be.a('function');
      });

      it('should take a frame duration and transform then continue the chain', () => {
        const chainable = getTweener({ foo: 1 })
          .addFrame(100, { foo: 2 });

        expect(chainable).to.be.an('object');
        expect(chainable.addFrame).to.be.a('function');
        expect(chainable.start).to.be.a('function');
      });

      it('should return a tween function after calling start with a timestamp', () => {
        const tween = getTweener({ foo: 1 })
          .addFrame(100, { foo: 2 })
          .start(1000);

        expect(tween).to.be.a('function');
      });

      it('should mutate the target object with the returned tween function', () => {
        const target = { foo: 1 };
        const tween = getTweener(target)
          .addFrame(100, { foo: 2 })
          .start(1000);

        tween(1100);
        expect(target.foo).to.equal(2);
      });

      it('should apply partial transforms to numbers', () => {
        const target = { foo: 1 };
        const tween = getTweener(target)
          .addFrame(100, { foo: 5 })
          .start(1000);

        tween(1050);
        expect(target.foo).to.equal(3);
      });

      it('should transform multiple times until the duration is complete', () => {
        const target = { foo: 1 };
        const tween = getTweener(target)
          .addFrame(100, { foo: 5 })
          .start(1000);

        tween(1025);
        expect(target.foo).to.equal(2);

        tween(1050);
        expect(target.foo).to.equal(3);

        tween(1075);
        expect(target.foo).to.equal(4);

        tween(1100);
        expect(target.foo).to.equal(5);
      });

      it('should modify booleans, strings, and null only once the duration has elapsed', () => {
        const target = { foo: true, bar: 'qux', baz: 72 };
        const tween = getTweener(target)
          .addFrame(100, { foo: false, bar: 'quux', baz: null })
          .start(1000);

        tween(1050);
        expect(target.foo).to.equal(true);
        expect(target.bar).to.equal('qux');
        expect(target.baz).to.equal(72);

        tween(1100);
        expect(target.foo).to.equal(false);
        expect(target.bar).to.equal('quux');
        expect(target.baz).to.equal(null);
      });

      it('should return true if there is more tweening left to do', () => {
        const target = { foo: 1 };
        const tween = getTweener(target)
          .addFrame(100, { foo: 5 })
          .start(1000);

        expect(tween(1050)).to.equal(true);
      });

      it('should return false if the transform is complete', () => {
        const target = { foo: 1 };
        const tween = getTweener(target)
          .addFrame(100, { foo: 5 })
          .start(1000);

        expect(tween(1100)).to.equal(false);
      });
    });

    describe('additional features', () => {
      it('should mutate multiple properties', () => {
        const target = { foo: 1, bar: -1 };
        const tween = getTweener(target)
          .addFrame(100, { foo: 2, bar: -2 })
          .start(1000);

        tween(1100);
        expect(target.foo).to.equal(2);
        expect(target.bar).to.equal(-2);
      });

      it('should mutate nested properties', () => {
        const nested = { baz: -1, qux: 0 };
        const target = { foo: 1, bar: nested };
        const tween = getTweener(target)
          .addFrame(100, { bar: { qux: 100 } })
          .start(1000);

        tween(1100);
        expect(target.foo).to.equal(1);
        expect(target.bar).to.equal(nested);
        expect(target.bar.baz).to.equal(-1);
        expect(target.bar.qux).to.equal(100);
      });

      it('should optionally add an easing function to a frame', () => {
        const target = { foo: 1 };
        const tween = getTweener(target)
          .addFrame(100, { foo: 5 }, easeOut)
          .start(1000);

        tween(1000);
        expect(target.foo).to.equal(1);

        tween(1050);
        expect(target.foo).to.be.greaterThan(3);

        tween(1100);
        expect(target.foo).to.equal(5);
      });

      it('should accept multiple frames', () => {
        const target = { foo: 1 };
        const tween = getTweener(target)
          .addFrame(100, { foo: 5 })
          .addFrame(100, { foo: 7 })
          .addFrame(100, { foo: -5 })
          .start(1000);

        tween(1000);
        expect(target.foo).to.equal(1);

        tween(1050);
        expect(target.foo).to.equal(3);

        tween(1100);
        expect(target.foo).to.equal(5);

        tween(1150);
        expect(target.foo).to.equal(6);

        tween(1200);
        expect(target.foo).to.equal(7);

        tween(1250);
        expect(target.foo).to.equal(1);

        tween(1300);
        expect(target.foo).to.equal(-5);
      });

      it('should use the first tween call as a start value if not passed explicitly', () => {
        const target = { foo: 1 };
        const tween = getTweener(target)
          .addFrame(100, { foo: 5 })
          .start();

        tween(500);
        expect(target.foo).to.equal(1);

        tween(550);
        expect(target.foo).to.equal(3);

        tween(600);
        expect(target.foo).to.equal(5);
      });
    });

    describe('handling edge cases', () => {
      it('should not mutate properties not specified in the transform', () => {
        const target = { foo: 1, bar: -1 };
        const tween = getTweener(target)
          .addFrame(100, { foo: 2 })
          .start(1000);

        tween(1100);
        expect(target.bar).to.equal(-1);
      });

      it('should not apply further transforms after reaching the duration', () => {
        const target = { foo: 1 };
        const tween = getTweener(target)
          .addFrame(100, { foo: 5 })
          .start(1000);

        tween(1500);
        expect(target.foo).to.equal(5);

        tween(2000);
        expect(target.foo).to.equal(5);

        tween(1050);
        expect(target.foo).to.equal(5);
      });

      it('should tween from a base value not set until mid-tween', () => {
        const target = { foo: 1 };
        const tween = getTweener(target)
          .addFrame(100, { foo: 5 })
          .start(1000);

        target.foo = 3;

        tween(1050);
        expect(target.foo).to.equal(4);

        tween(1075);
        expect(target.foo).to.equal(4.5);

        tween(1100);
        expect(target.foo).to.equal(5);
      });

      it('should tween from a base value set before start but after tween is built', () => {
        const target = { foo: 1 };
        const tween = getTweener(target)
          .addFrame(100, { foo: 5 })
          .start(1100);

        tween(1050);
        target.foo = 3;

        tween(1100);
        expect(target.foo).to.equal(3);

        tween(1150);
        expect(target.foo).to.equal(4);

        tween(1200);
        expect(target.foo).to.equal(5);
      });

      it('should handle no frames without any transformation', () => {
        const target = { foo: 1 };
        const tween = getTweener(target)
          .start(1000);

        expect(tween(950)).to.equal(true);
        expect(tween(1050)).to.equal(false);
        expect(tween(950)).to.equal(false);

        expect(target).to.deep.equal({ foo: 1 });
      });

      it('should tween key frames from the last position, even when skipped', () => {
        const target = { foo: 1 };
        const tween = getTweener(target)
          .addFrame(100, { foo: 5 })
          .addFrame(100, { foo: 7 })
          .start(1000);

        tween(1150);
        expect(target.foo).to.equal(6);
      });

      it('should allow for forking into multiple tween functions', () => {
        const target = { foo: 1, bar: -1 };

        const targetBuilder = getTweener(target);
        const tweenFoo = targetBuilder
          .addFrame(100, { foo: 5 })
          .start(1000);

        const barBuilder = targetBuilder
          .addFrame(100, { bar: -5 });
        const tweenBar = barBuilder
          .start(1000);
        const tweenBarMore = barBuilder
          .addFrame(100, { bar: -105 })
          .start(2000);

        tweenFoo(1100);
        expect(target.foo).to.equal(5);
        expect(target.bar).to.equal(-1);

        tweenBar(1100);
        expect(target.foo).to.equal(5);
        expect(target.bar).to.equal(-5);

        tweenBar(2200);
        expect(target.foo).to.equal(5);
        expect(target.bar).to.equal(-5);

        tweenBarMore(2200);
        expect(target.foo).to.equal(5);
        expect(target.bar).to.equal(-105);
      });
    });
  });

  describe('getTimeout', () => {
    it('should take a callback function and a delay and return a function', () => {
      const timeout = getTimeout(() => {}, 100);

      expect(timeout).to.be.a('function');
    });

    it('should call the passed callback with a timestamp once the delay is reached', () => {
      const callback = sinon.spy();
      const timeout = getTimeout(callback, 100);

      timeout(1000);
      expect(callback).to.have.not.been.called;

      timeout(1050);
      expect(callback).to.have.not.been.called;

      timeout(1100);
      expect(callback).to.have.been.calledWith(1100);
    });

    it('should return true if the callback is still waiting to be called', () => {
      const timeout = getTimeout(() => {}, 100);

      expect(timeout(1000)).to.equal(true);
    });

    it('should always return false once the callback has already been called', () => {
      const timeout = getTimeout(() => {}, 100);

      timeout(1000);
      expect(timeout(1100)).to.equal(false);

      expect(timeout(1200)).to.equal(false);
      expect(timeout(900)).to.equal(false);
      expect(timeout(-1)).to.equal(false);
      expect(timeout(Infinity)).to.equal(false);
    });
  });

  describe('getInterval', () => {
    it('should take a callback function and a duration and return a function', () => {
      const interval = getInterval(() => {}, 100);

      expect(interval).to.be.a('function');
    });

    it('should call the callback with the timestamp each time the duration is passed', () => {
      const callback = sinon.spy();
      const interval = getInterval(callback, 100);

      interval(1000);
      expect(callback).to.have.not.been.called;

      interval(1050);
      expect(callback).to.have.not.been.called;

      interval(1100);
      expect(callback).to.have.been.calledWith(1100);

      interval(1200);
      interval(1300);

      expect(callback).to.have.been.calledThrice;
    });

    it('should not re-call the callback for the same timestamp', () => {
      const callback = sinon.spy();
      const interval = getInterval(callback, 100);

      interval(1000);

      interval(1100);
      interval(1100);
      interval(900);
      interval(1000);
      interval(1100);

      expect(callback).to.have.been.calledOnce;
    });

    it('should call the callback repeatedly if enough time has passed', () => {
      const callback = sinon.spy();
      const interval = getInterval(callback, 100);

      interval(1000);
      interval(1300);

      expect(callback).to.have.been.calledThrice;
    });

    it('should return always return true', () => {
      const interval = getInterval(() => {}, 100);

      expect(interval(1000)).to.equal(true);
      expect(interval(1100)).to.equal(true);
      expect(interval(-1)).to.equal(true);
    });
  });
});
