'use strict';

const { expect } = require('chai');
const {
  initVitals,
  setCalories,
  drainCalories,
} = require('./vitals.common.js');

describe('Spike methods', () => {
  describe('initVitals', () => {
    it('should init a vitals object with starting values', () => {
      const vitals = initVitals(100);

      expect(vitals).to.be.an('object');
      expect(vitals.calories).to.be.a('number');
      expect(vitals.diesAt).to.be.a('number');
      expect(vitals.spawnsAt).to.be.a('number');
      expect(vitals.isDead).to.equal(vitals.calories < vitals.diesAt);
    });
  });

  describe('setCalories', () => {
    it('should mutate a vitals object with a specific calorie level', () => {
      const vitals = initVitals(100);
      setCalories(vitals, 50);

      expect(vitals.calories).to.equal(50);
    });

    it('should update isDead as needed', () => {
      const vitals = initVitals(100);
      vitals.isDead = 50;
      setCalories(vitals, 49);

      expect(vitals.isDead).to.equal(true);
    });
  });

  describe('drainCalories', () => {
    it('should drain calories from a vitals object', () => {
      const vitals = { calories: 100, diesAt: 50, isDead: false };
      drainCalories(vitals, 25);

      expect(vitals.calories).to.equal(75);
    });

    it('should return the actual amount drained', () => {
      const vitals = { calories: 100, diesAt: 50, isDead: false };
      const actualDrain = drainCalories(vitals, 200);

      expect(actualDrain).to.equal(100);
    });

    it('should mark vitals as dead if calories drops below threshold', () => {
      const vitals = { calories: 100, diesAt: 50, isDead: false };
      drainCalories(vitals, 75);

      expect(vitals.isDead).to.equal(true);
    });
  });
});
