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
    it('should take an object, a transform, a start, a duration, and return a function', () => {
      const target = { foo: 1, bar: 2 };
      expect(getTweener(target, { foo: 5 }, 1000, 100)).to.be.a('function');
    });

    it('should mutate the target object with the returned tween function', () => {
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5 }, 1000, 100);

      tween(1100);
      expect(target.foo).to.equal(5);
    });

    it('should apply partial transforms to numbers', () => {
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5 }, 1000, 100);

      tween(1050);
      expect(target.foo).to.equal(3);
    });

    it('should accept multiple transform properties', () => {
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5, bar: -8 }, 1000, 100);

      tween(1050);
      expect(target.foo).to.equal(3);
      expect(target.bar).to.equal(-3);
    });

    it('should transform multiple times until the duration is complete', () => {
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5 }, 1000, 100);

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
      const tween = getTweener(target, { foo: false, bar: 'quux', baz: null }, 1000, 100);

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
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5 }, 1000, 100);

      tween(1500);
      expect(target.foo).to.equal(5);

      tween(2000);
      expect(target.foo).to.equal(5);

      tween(1050);
      expect(target.foo).to.equal(5);
    });

    it('should return true if there is more transforming left to do', () => {
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5 }, 1000, 100);

      expect(tween(1050)).to.equal(true);
    });

    it('should return false if the transform is complete', () => {
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5 }, 1000, 100);

      expect(tween(1100)).to.equal(false);
    });

    it('should optionally take an easing function', () => {
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5 }, 1000, 100, easeOut);

      tween(1000);
      expect(target.foo).to.equal(1);

      tween(1050);
      expect(target.foo).to.be.greaterThan(3);

      tween(1100);
      expect(target.foo).to.equal(5);
    });
  });
});
