'use strict';

const { expect } = require('chai');
const {
  settings,
  updateSetting,
  addUpdateListener,
  getSetting,
} = require('./settings.common.js');
require('./meebas/genome.common.js');

describe('Settings methods', () => {
  const oldSeed = settings.core.seed;
  const oldMassBits = settings.genome.bitsPerMass;

  afterEach(() => {
    settings.core.seed = oldSeed;
    settings.genome.bitsPerMass = oldMassBits;
    delete settings.foo;
  });

  describe('updateSetting', () => {
    it('should update a core setting when passed a single key', () => {
      updateSetting('seed', 'foo');
      expect(settings.core.seed).to.equal('foo');
    });

    it('should update a module setting if passed a path', () => {
      updateSetting('genome.bitsPerMass', 4);
      expect(settings.genome.bitsPerMass).to.equal(4);
    });

    it('should create new nested settings if they do not exist', () => {
      updateSetting('foo.bar', false);
      expect(settings.foo).to.deep.equal({ bar: false });
    });
  });

  describe('addUpdateListener', () => {
    it('should call the passed function whenever the settings are updated', () => {
      let upperCaseSeed;
      addUpdateListener(() => {
        upperCaseSeed = settings.core.seed.toUpperCase();
      });

      updateSetting('seed', 'foo');

      expect(upperCaseSeed).to.equal('FOO');
    });

    it('should initialize the dependent setting at call time', () => {
      settings.core.seed = 'foo';
      let upperCaseSeed;
      addUpdateListener(() => {
        upperCaseSeed = settings.core.seed.toUpperCase();
      });

      expect(upperCaseSeed).to.equal('FOO');
    });
  });

  describe('getSetting', () => {
    it('should fetch a core setting when passed a single key', () => {
      expect(getSetting('seed')).to.equal(settings.core.seed);
    });

    it('should fetch a module setting if passed a path', () => {
      expect(getSetting('genome.bitsPerMass')).to.equal(settings.genome.bitsPerMass);
    });
  });
});
