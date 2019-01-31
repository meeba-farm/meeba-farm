'use strict';

/* eslint-disable no-underscore-dangle */
const chai = require('chai');

const FLOAT_TOLERANCE = 1e-12;

// Something for testing float value equality
chai.Assertion.addMethod('veryCloseTo', function veryCloseTo(float) {
  new chai.Assertion(this._obj).to.be.closeTo(float, FLOAT_TOLERANCE);
});
