'use strict';

/* eslint-disable no-underscore-dangle */
const chai = require('chai');
const { seedPrng } = require('./app/utils/math.common.js');

const FLOAT_TOLERANCE = 1e-12;

// Basic window stub
global.atob = () => 'foo';
global.btoa = () => 'foo';
global.localStorage = {
  getItem: () => 'foo',
  setItem: () => {},
  removeItem: () => {},
};

// Seed PRNG with a random string
seedPrng(Math.random().toString(36).slice(2));

// Something for testing float value equality
chai.Assertion.addMethod('veryCloseTo', function veryCloseTo(float) {
  new chai.Assertion(this._obj).to.be.closeTo(float, FLOAT_TOLERANCE);
});
