'use strict';

const { expect } = require('chai');
const { range } = require('./arrays.common.js');

describe('Array utils', () => {
  describe('range', () => {
    it('should create an array with a given length', () => {
      expect(range(3)).to.be.an('array').with.a.lengthOf(3);
    });

    it('should create an array with indexes as values', () => {
      expect(range(3)).to.deep.equal([0, 1, 2]);
    });

    it('should create an empty array when given a length of 0', () => {
      expect(range(0)).to.be.an('array').with.a.lengthOf(0);
    });
  });
});
