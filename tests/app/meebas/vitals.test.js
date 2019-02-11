'use strict';

const { expect } = require('chai');
const {
  initVitals,
  drainCalories,
} = require('./vitals.common.js');

const expectIsValidNewVitals = (vitals) => {
  expect(vitals).to.be.an('object');
  expect(vitals.calories).to.be.a('number');
  expect(vitals.diesAt).to.be.a('number');
  expect(vitals.spawnsAt).to.be.a('number');
  expect(vitals.isDead).to.equal(false);
};

describe('Spike methods', () => {
  describe('initVitals', () => {
    it('should init a vitals object with starting values', () => {
      const vitals = {};
      initVitals(vitals, 100);
      expectIsValidNewVitals(vitals);
    });

    it('should reuse an existing reference with new values', () => {
      const vitals = {};
      initVitals(vitals, 100);
      const oldValues = JSON.parse(JSON.stringify(vitals));
      initVitals(vitals, 200);

      expect(vitals).to.not.deep.equal(oldValues);
      expectIsValidNewVitals(vitals);
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
