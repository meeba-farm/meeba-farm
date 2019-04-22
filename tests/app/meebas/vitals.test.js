'use strict';

const { expect } = require('chai');
const { spawnSpike } = require('./spikes.common.js');
const {
  initVitals,
  drainCalories,
} = require('./vitals.common.js');

describe('Vitals methods', () => {
  describe('initVitals', () => {
    it('should init a vitals object with starting values', () => {
      const vitals = initVitals(100, []);

      expect(vitals).to.be.an('object');
      expect(vitals.calories).to.be.a('number');
      expect(vitals.diesAt).to.be.a('number');
      expect(vitals.spawnsAt).to.be.a('number');
      expect(vitals.isDead).to.equal(vitals.calories < vitals.diesAt);
    });

    it('should include spikes in upkeep calculation', () => {
      const noSpikes = initVitals(100, []);
      const withSpikes = initVitals(100, [spawnSpike(10, 0, 10)]);

      expect(noSpikes.upkeep).to.be.lessThan(withSpikes.upkeep);
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
  });
});
