'use strict';

const { expect } = require('chai');
const {
  PI_2,
  sqr,
  dotProduct,
  roundAngle,
  sin,
  cos,
  asin,
  acos,
  isShorter,
  isCloser,
  getGap,
  rand,
  randInt,
} = require('./math.common.js');

// Tolerances for look-up table values being slightly off
const LUT_TOLERANCE = 0.01;

describe('Math utils', () => {
  describe('PI_2', () => {
    it('should be equal to 2π', () => {
      expect(PI_2).to.equal(2 * Math.PI);
    });
  });

  describe('dotProduct', () => {
    it('should return the dot product of two sets of numbers', () => {
      expect(dotProduct([2, 3], [4, 5])).to.equal(23);
      expect(dotProduct([4, 2, 0], [7, 1, 3])).to.equal(30);
      expect(dotProduct([-1, 0], [5, 2])).to.equal(-5);
    });
  });

  describe('sqr', () => {
    it('should return the square of a number', () => {
      expect(sqr(2)).to.equal(4);
      expect(sqr(10)).to.equal(100);
      expect(sqr(0)).to.equal(0);
      expect(sqr(-1)).to.equal(1);

      expect(sqr(0.123)).to.be.veryCloseTo(0.015129);
    });
  });

  describe('roundAngle', () => {
    it('should convert an angle in turns to the equivalent between 0 and 1', () => {
      expect(roundAngle(0.5)).to.equal(0.5);
      expect(roundAngle(0)).to.equal(0);
      expect(roundAngle(1)).to.equal(0);
      expect(roundAngle(-1)).to.equal(0);

      expect(roundAngle(100.123)).to.be.veryCloseTo(0.123);
      expect(roundAngle(-97.456)).to.be.veryCloseTo(0.544);
    });
  });

  describe('sin', () => {
    it('should return the approximate sine of an angle between 0 and 1 turns', () => {
      expect(sin(0)).to.be.veryCloseTo(0);
      expect(sin(0.25)).to.be.veryCloseTo(1);
      expect(sin(0.5)).to.be.veryCloseTo(0);
      expect(sin(0.75)).to.be.veryCloseTo(-1);

      expect(sin(0.1)).to.be.closeTo(0.5878, LUT_TOLERANCE);
      expect(sin(0.8)).to.be.closeTo(-0.9511, LUT_TOLERANCE);
    });

    it('should return the correct sine for angles less than zero and greater than 1', () => {
      expect(sin(-1)).to.be.veryCloseTo(0);
      expect(sin(1.25)).to.be.veryCloseTo(1);
      expect(sin(2.5)).to.be.veryCloseTo(0);
      expect(sin(-5.25)).to.be.veryCloseTo(-1);

      expect(sin(-99.9)).to.be.closeTo(0.5878, LUT_TOLERANCE);
      expect(sin(100.8)).to.be.closeTo(-0.9511, LUT_TOLERANCE);
    });
  });

  describe('cos', () => {
    it('should return the approximate cosine of an angle between 0 and 1 turns', () => {
      expect(cos(0)).to.be.veryCloseTo(1);
      expect(cos(0.25)).to.be.veryCloseTo(0);
      expect(cos(0.5)).to.be.veryCloseTo(-1);
      expect(cos(0.75)).to.be.veryCloseTo(0);

      expect(cos(0.1)).to.be.closeTo(0.8090, LUT_TOLERANCE);
      expect(cos(0.8)).to.be.closeTo(0.3090, LUT_TOLERANCE);
    });

    it('should return the correct cosine for angles less than zero and greater than 1', () => {
      expect(cos(-1)).to.be.veryCloseTo(1);
      expect(cos(1.25)).to.be.veryCloseTo(0);
      expect(cos(2.5)).to.be.veryCloseTo(-1);
      expect(cos(-5.25)).to.be.veryCloseTo(0);

      expect(cos(-99.9)).to.be.closeTo(0.8090, LUT_TOLERANCE);
      expect(cos(100.8)).to.be.closeTo(0.3090, LUT_TOLERANCE);
    });
  });

  describe('asin', () => {
    it('should return an approximate arccosine as an angle between 0 and 1 turns', () => {
      expect(asin(1)).to.be.veryCloseTo(0.25);
      expect(asin(0)).to.be.veryCloseTo(0);
      expect(asin(-1)).to.be.veryCloseTo(-0.25);

      expect(asin(0.3)).to.be.closeTo(0.0485, LUT_TOLERANCE);
      expect(asin(-0.75)).to.be.closeTo(-0.1350, LUT_TOLERANCE);
    });
  });

  describe('acos', () => {
    it('should return an approximate arccosine as an angle between 0 and 1 turns', () => {
      expect(acos(1)).to.be.veryCloseTo(0);
      expect(acos(0)).to.be.veryCloseTo(0.25);
      expect(acos(-1)).to.be.veryCloseTo(0.5);

      expect(acos(0.3)).to.be.closeTo(0.2015, LUT_TOLERANCE);
      expect(acos(-0.75)).to.be.closeTo(0.3850, LUT_TOLERANCE);
    });
  });

  describe('isShorter', () => {
    it('should compare the length of line segment to a set distance', () => {
      expect(isShorter({ x1: 0, y1: 0, x2: 3, y2: 0 }, 4)).to.be.true;
      expect(isShorter({ x1: 0, y1: 0, x2: 3, y2: 0 }, 2)).to.be.false;

      expect(isShorter({ x1: 10, y1: 10, x2: 10, y2: 20 }, 11)).to.be.true;
      expect(isShorter({ x1: 10, y1: 10, x2: 10, y2: 20 }, 9)).to.be.false;

      expect(isShorter({ x1: 1, y1: 1, x2: 2, y2: 2 }, 1.415)).to.be.true;
      expect(isShorter({ x1: 1, y1: 1, x2: 2, y2: 2 }, 1.413)).to.be.false;

      expect(isShorter({ x1: 120, y1: 83, x2: 572, y2: 313 }, 508)).to.be.true;
      expect(isShorter({ x1: 120, y1: 83, x2: 572, y2: 313 }, 506)).to.be.false;
    });
  });

  describe('isCloser', () => {
    it('should compare the shortest distance between a point a line to a set distance', () => {
      expect(isCloser({ x: 2, y: 3 }, { x1: 0, y1: 0, x2: 4, y2: 0 }, 4)).to.be.true;
      expect(isCloser({ x: 2, y: 3 }, { x1: 0, y1: 0, x2: 4, y2: 0 }, 2)).to.be.false;

      expect(isCloser({ x: 20, y: 15 }, { x1: 10, y1: 10, x2: 10, y2: 20 }, 11)).to.be.true;
      expect(isCloser({ x: 20, y: 15 }, { x1: 10, y1: 10, x2: 10, y2: 20 }, 9)).to.be.false;

      expect(isCloser({ x: 2, y: 1 }, { x1: 1, y1: 1, x2: 2, y2: 2 }, 0.708)).to.be.true;
      expect(isCloser({ x: 2, y: 1 }, { x1: 1, y1: 1, x2: 2, y2: 2 }, 0.706)).to.be.false;
    });

    it('should compare the shortest distance when the point is beyond the line', () => {
      expect(isCloser({ x: 7, y: 0 }, { x1: 0, y1: 0, x2: 4, y2: 0 }, 4)).to.be.true;
      expect(isCloser({ x: 7, y: 0 }, { x1: 0, y1: 0, x2: 4, y2: 0 }, 2)).to.be.false;

      expect(isCloser({ x: 10, y: 0 }, { x1: 10, y1: 10, x2: 10, y2: 20 }, 11)).to.be.true;
      expect(isCloser({ x: 10, y: 0 }, { x1: 10, y1: 10, x2: 10, y2: 20 }, 9)).to.be.false;

      expect(isCloser({ x: 3, y: 3 }, { x1: 1, y1: 1, x2: 2, y2: 2 }, 1.415)).to.be.true;
      expect(isCloser({ x: 3, y: 3 }, { x1: 1, y1: 1, x2: 2, y2: 2 }, 1.414)).to.be.false;
    });

    it('should compare the shortest distance when the line has a length of zero', () => {
      expect(isCloser({ x: 95, y: 95 }, { x1: 100, y1: 100, x2: 100, y2: 100 }, 7.08)).to.be.true;
      expect(isCloser({ x: 95, y: 95 }, { x1: 100, y1: 100, x2: 100, y2: 100 }, 7.06)).to.be.false;
    });
  });

  describe('getGap', () => {
    it('should find the difference between two angles in turns', () => {
      expect(getGap(0.5, 0)).to.be.veryCloseTo(0.5);
      expect(getGap(1, 0.5)).to.be.veryCloseTo(0.5);
      expect(getGap(0.6, 0.35)).to.be.veryCloseTo(0.25);
    });

    it('should return the shortest possible gap (i.e less than half a turn)', () => {
      expect(getGap(0, 0.75)).to.be.veryCloseTo(0.25);
      expect(getGap(2.5, 1)).to.be.veryCloseTo(0.5);
      expect(getGap(-0.35, 1.6)).to.be.veryCloseTo(0.05);
    });
  });

  describe('rand', () => {
    it('should return a random number between 0 and 1', () => {
      expect(rand()).to.be.within(0, 1);
      expect(rand()).to.be.within(0, 1);
      expect(rand()).to.be.within(0, 1);
    });

    it('should not return the same number twice', () => {
      const randVal1 = rand();
      const randVal2 = rand();
      const randVal3 = rand();

      expect(randVal1).to.not.equal(randVal2);
      expect(randVal1).to.not.equal(randVal3);
      expect(randVal2).to.not.equal(randVal3);
    });

    it('should return the same number when restarted from the same seed', () => {
      // This is unorthodox and implementation dependent but will get us
      // two rand functions with the same seed
      delete require.cache[require.resolve('./math.common.js')];
      // eslint-disable-next-line global-require
      const { rand: rand1 } = require('./math.common.js');

      delete require.cache[require.resolve('./math.common.js')];
      // eslint-disable-next-line global-require
      const { rand: rand2 } = require('./math.common.js');

      expect(rand1()).to.equal(rand2());
      expect(rand1()).to.equal(rand2());
      expect(rand1()).to.equal(rand2());
    });
  });

  describe('randInt', () => {
    it('should return a random number between a min and a max (non-inclusive)', () => {
      expect(randInt(0, 10)).to.be.within(0, 9);
      expect(randInt(-100, 0)).to.be.within(-100, -1);
      expect(randInt(1, 2)).to.equal(1);
    });

    it('should only return whole integers', () => {
      const randVal1 = randInt(0, 100);
      const randVal2 = randInt(0, 100);
      const randVal3 = randInt(0, 100);

      expect(Math.floor(randVal1)).to.equal(randVal1);
      expect(Math.floor(randVal2)).to.equal(randVal2);
      expect(Math.floor(randVal3)).to.equal(randVal3);
    });
  });
});
