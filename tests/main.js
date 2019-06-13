'use strict';

/* eslint-disable no-underscore-dangle */
const chai = require('chai');
const sinonChai = require('sinon-chai');
const { seedPrng } = require('./app/utils/math.common.js');
const { stubWindow } = require('./utils/browser-interop.js');

const FLOAT_TOLERANCE = 1e-12;

// Seed PRNG with a random string
seedPrng(Math.random().toString(36).slice(2));
stubWindow();

chai.use(sinonChai);

// Something for testing float value equality
chai.Assertion.addMethod('veryCloseTo', function veryCloseTo(float) {
  new chai.Assertion(this._obj).to.be.closeTo(float, FLOAT_TOLERANCE);
});
