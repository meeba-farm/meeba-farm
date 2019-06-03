'use strict';

const { expect } = require('chai');
const { range } = require('./arrays.common.js');
const {
  PI_2,
  sqr,
  sum,
  minimum,
  maximum,
  mean,
  mode,
  dotProduct,
  roundRange,
  normalize,
  roundAngle,
  getGap,
  sin,
  cos,
  asin,
  acos,
  seedPrng,
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

  describe('sqr', () => {
    it('should return the square of a number', () => {
      expect(sqr(2)).to.equal(4);
      expect(sqr(10)).to.equal(100);
      expect(sqr(0)).to.equal(0);
      expect(sqr(-1)).to.equal(1);

      expect(sqr(0.123)).to.be.veryCloseTo(0.015129);
    });
  });

  describe('sum', () => {
    it('should return the sum of an array of numbers', () => {
      expect(sum([1, 2, 3, 4])).to.equal(10);
      expect(sum([4, 1, 3, 2])).to.equal(10);
      expect(sum([1])).to.equal(1);
      expect(sum([5, 3.1, 178, -5, 8])).to.equal(189.1);
    });

    it('should return NaN if passed an empty array', () => {
      expect(sum([])).to.be.NaN;
    });

    it('should not mutate the passed array', () => {
      const numbers = [4, 1, 3, 2];
      sum(numbers);
      expect(numbers).to.deep.equal([4, 1, 3, 2]);
    });
  });

  describe('minimum', () => {
    it('should return the least of an array of numbers', () => {
      expect(minimum([1, 2, 3, 4])).to.equal(1);
      expect(minimum([4, 1, 3, 2])).to.equal(1);
      expect(minimum([1])).to.equal(1);
      expect(minimum([5, 3.1, 178, -5, 8])).to.equal(-5);
    });

    it('should return NaN if passed an empty array', () => {
      expect(minimum([])).to.be.NaN;
    });

    it('should not mutate the passed array', () => {
      const numbers = [4, 1, 3, 2];
      minimum(numbers);
      expect(numbers).to.deep.equal([4, 1, 3, 2]);
    });
  });

  describe('maximum', () => {
    it('should return the highest of an array of numbers', () => {
      expect(maximum([1, 2, 3, 4])).to.equal(4);
      expect(maximum([4, 1, 3, 2])).to.equal(4);
      expect(maximum([1])).to.equal(1);
      expect(maximum([5, 3.1, 178, -5, 8])).to.equal(178);
    });

    it('should return NaN if passed an empty array', () => {
      expect(maximum([])).to.be.NaN;
    });

    it('should not mutate the passed array', () => {
      const numbers = [4, 1, 3, 2];
      maximum(numbers);
      expect(numbers).to.deep.equal([4, 1, 3, 2]);
    });
  });

  describe('mean', () => {
    it('should return the average of an array of numbers', () => {
      expect(mean([1, 2, 3, 4])).to.equal(2.5);
      expect(mean([4, 1, 3, 2])).to.equal(2.5);
      expect(mean([1])).to.equal(1);
      expect(mean([5, 3.1, 178, -5, 8])).to.equal(37.82);
    });

    it('should return NaN if passed an empty array', () => {
      expect(mean([])).to.be.NaN;
    });

    it('should not mutate the passed array', () => {
      const numbers = [4, 1, 3, 2];
      mean(numbers);
      expect(numbers).to.deep.equal([4, 1, 3, 2]);
    });
  });

  describe('mode', () => {
    it('should return the middle value in an array of numbers', () => {
      expect(mode([1, 2, 4])).to.equal(2);
      expect(mode([4, 1, 2])).to.equal(2);
      expect(mode([1, 2, 3, 4])).to.equal(2);
      expect(mode([1])).to.equal(1);
      expect(mode([5, 3.1, 178, -5, 8])).to.equal(5);
    });

    it('should return NaN if passed an empty array', () => {
      expect(mode([])).to.be.NaN;
    });

    it('should not mutate the passed array', () => {
      const numbers = [4, 1, 2];
      mode(numbers);
      expect(numbers).to.deep.equal([4, 1, 2]);
    });
  });

  describe('dotProduct', () => {
    it('should return the dot product of two sets of numbers', () => {
      expect(dotProduct([2, 3], [4, 5])).to.equal(23);
      expect(dotProduct([4, 2, 0], [7, 1, 3])).to.equal(30);
      expect(dotProduct([-1, 0], [5, 2])).to.equal(-5);
    });
  });

  describe('roundRange', () => {
    it('should should leave the number unchanged if within the range', () => {
      expect(roundRange(1234, 0, 10000)).to.equal(1234);
      expect(roundRange(1.337, 1.2, 1.4)).to.equal(1.337);
    });

    it('should return the minimum if the number is below it', () => {
      expect(roundRange(-100, 0, 100)).to.equal(0);
      expect(roundRange(1.9999, 2, 3)).to.equal(2);
    });

    it('should return the maximum if the number is above it', () => {
      expect(roundRange(1000, -200, -100)).to.equal(-100);
      expect(roundRange(5.00001, -5, 5)).to.equal(5);
    });
  });

  describe('normalize', () => {
    it('should return the percentage a number is between a min and max', () => {
      expect(normalize(50, 0, 100)).to.equal(0.5);
      expect(normalize(20, 20, 2000)).to.equal(0);
      expect(normalize(255, 0, 255)).to.equal(1);
      expect(normalize(75, -100, 100)).to.equal(0.875);
      expect(normalize(2001, 1000, 11000)).to.equal(0.1001);
    });

    it('should return zero if the number is below the minimum', () => {
      expect(normalize(-101, 0, 100)).to.equal(0);
    });

    it('should return one if the number is above the maximum', () => {
      expect(normalize(10001, 0, 100)).to.equal(1);
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

  describe('seedPrng', () => {
    it('should accept any string as a seed', () => {
      expect(() => seedPrng('f0O\nb$R\t;-" !')).to.not.throw();
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
      seedPrng('foo');
      const randNums = range(10).map(rand);

      seedPrng('foo');
      const randNumsAgain = range(10).map(rand);

      expect(randNums).to.deep.equal(randNumsAgain);
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
