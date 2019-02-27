'use strict';

const { expect } = require('chai');
const {
  range,
  flatten,
  chunk,
  groupBy,
  toBytes,
  toHex,
} = require('./arrays.common.js');

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

  describe('flatten', () => {
    it('should shallowly flatten an array', () => {
      expect(flatten([[1, 2], [3, 4]])).to.deep.equal([1, 2, 3, 4]);
    });

    it('should not affect an already flat array', () => {
      expect(flatten([[1, 2, 3]])).to.deep.equal([1, 2, 3]);
    });

    it('should not deeply flatten a highly nested array', () => {
      expect(flatten([[[1, 2], 3], 4])).to.deep.equal([[1, 2], 3, 4]);
    });
  });

  describe('chunk', () => {
    it('should create a new 2D array with evenly sized chunks', () => {
      expect(chunk([1, 2, 3, 4], 2)).to.deep.equal([[1, 2], [3, 4]]);
    });

    it('should include any extra elements in the final chunk', () => {
      expect(chunk([1, 2, 3, 4], 3)).to.deep.equal([[1, 2, 3], [4]]);
    });
  });

  describe('groupBy', () => {
    it('should group array items into sub-arrays by function output', () => {
      const grouped = groupBy([3.3, 2.1, 3.9, 1], Math.floor);

      expect(grouped).to.deep.equal({
        1: [1],
        2: [2.1],
        3: [3.3, 3.9],
      });
    });

    it('should group actual objects not copies', () => {
      const ungrouped = [
        { foo: 'qux', bar: 'baz' },
        { foo: 'quux', bar: 'quuz' },
        { foo: 'qux', bar: 'corge' },
      ];

      const grouped = groupBy(ungrouped, obj => obj.foo);

      expect(grouped.qux[0]).to.equal(ungrouped[0]);
      expect(grouped.quux[0]).to.equal(ungrouped[1]);
      expect(grouped.qux[1]).to.equal(ungrouped[2]);
    });
  });

  describe('toBytes', () => {
    it('should create a Uint8Array from a hex string', () => {
      const bytes = toBytes('FF00BA');

      expect(bytes).to.be.an.instanceOf(Uint8Array).with.a.lengthOf(3);
      expect(bytes).to.deep.equal(new Uint8Array([255, 0, 186]));
    });

    it('should create an empty Uint8Array from an empty string', () => {
      const bytes = toBytes('');
      expect(bytes).to.be.an.instanceOf(Uint8Array).with.a.lengthOf(0);
    });
  });

  describe('toBytes', () => {
    it('should create a hex string from a Uint8Array', () => {
      const hex = toHex(new Uint8Array([255, 0, 186]));

      expect(hex).to.be.a('string').with.a.lengthOf(6);
      expect(hex).to.equal('FF00BA');
    });

    it('should create an empty Uint8Array from an empty string', () => {
      const hex = toHex(new Uint8Array([]));
      expect(hex).to.equal('');
    });
  });
});
