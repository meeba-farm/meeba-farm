'use strict';

const { expect } = require('chai');
const {
  easeLinear,
  easeIn,
  easeOut,
  getTweener,
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

  describe('getTweener', () => {
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

    it('should mutate multiple properties', () => {
      const target = { foo: 1, bar: -1 };
      const tween = getTweener(target)
        .addFrame(100, { foo: 2, bar: -2 })
        .start(1000);

      tween(1100);
      expect(target.foo).to.equal(2);
      expect(target.bar).to.equal(-2);
    });

    it('should not mutate properties not specified in the transform', () => {
      const target = { foo: 1, bar: -1 };
      const tween = getTweener(target)
        .addFrame(100, { foo: 2 })
        .start(1000);

      tween(1100);
      expect(target.bar).to.equal(-1);
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

    it('should throw an error if started with no frames', () => {
      const target = { foo: 1 };

      expect(() => getTweener(target).start(1000)).to.throw;
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
