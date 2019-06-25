'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const {
  map,
  filter,
  reduce,
  range,
  flatten,
  flatMap,
  chunk,
  findIndexes,
  chunkBy,
  groupBy,
  concatBytes,
  toBytes,
  toHex,
} = require('./arrays.common.js');

describe('Array utils', () => {
  describe('map', () => {
    it('should map over values in an array', () => {
      expect(map([1, 2, 3], n => n + 1)).to.deep.equal([2, 3, 4]);
    });
  });

  describe('filter', () => {
    it('should filter values in an array', () => {
      expect(filter([1, 2, 3], n => n % 2 === 0)).to.deep.equal([2]);
    });
  });

  describe('reduce', () => {
    it('should build an accumulator from values in an array', () => {
      expect(reduce([1, 2, 3], (sum, n) => sum + n)).to.equal(6);
    });
  });

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

  describe('flatMap', () => {
    it('should map over values in an array', () => {
      expect(flatMap([1, 2, 3], n => n + 1)).to.deep.equal([2, 3, 4]);
    });

    it('should flatten out returned arrays', () => {
      expect(flatMap([1, 3], n => [n, n + 1])).to.deep.equal([1, 2, 3, 4]);
    });

    it('should pass as arguments the value, key, and original array', () => {
      const spy = sinon.spy();
      const arr = [1, 2, 3];
      flatMap(arr, spy);

      expect(spy).to.have.been.calledThrice;
      expect(spy).to.have.been.calledWith(1, 0, arr);
      expect(spy).to.have.been.calledWith(2, 1, arr);
      expect(spy).to.have.been.calledWith(3, 2, arr);
    });
  });

  describe('chunk', () => {
    it('should create a new 2D array with evenly sized chunks', () => {
      expect(chunk([1, 2, 3, 4], 2)).to.deep.equal([[1, 2], [3, 4]]);
    });

    it('should include any extra elements in the final chunk', () => {
      expect(chunk([1, 2, 3, 4], 3)).to.deep.equal([[1, 2, 3], [4]]);
    });

    it('should create single item arrays if passed a size of 1', () => {
      expect(chunk([1, 2, 3, 4], 1)).to.deep.equal([[1], [2], [3], [4]]);
    });

    it('should create a single chunk if the size is greater than the array length', () => {
      expect(chunk([1, 2, 3, 4], 5)).to.deep.equal([[1, 2, 3, 4]]);
    });
  });

  describe('findIndexes', () => {
    it('should find a single index that matches a predicate', () => {
      const indexes = findIndexes(['foo', 'bar', 'baz'], item => item === 'bar');

      expect(indexes).to.deep.equal([1]);
    });

    it('should find multiple indexes that match a predicate', () => {
      const indexes = findIndexes([3, 1, 4, 1, 5, 9, 2], n => n > 3);

      expect(indexes).to.deep.equal([2, 4, 5]);
    });
  });

  describe('chunkBy', () => {
    it('should chunk an array based on a predicate that identifies a leading value', () => {
      const chunked = chunkBy([1, 2, 3, 4], n => n % 2 === 0);
      expect(chunked).to.deep.equal([[1], [2, 3], [4]]);
    });

    it('should not create an empty chunk if the first element passes the predicate', () => {
      const chunked = chunkBy([2, 3, 4, 5], n => n % 2 === 0);
      expect(chunked).to.deep.equal([[2, 3], [4, 5]]);
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

    it('should group array items by index', () => {
      const grouped = groupBy(['a', 'b', 'c', 'd'], (_, i) => (i % 2 === 0 ? 'evens' : 'odds'));

      expect(grouped).to.deep.equal({
        evens: ['a', 'c'],
        odds: ['b', 'd'],
      });
    });
  });

  describe('concatBytes', () => {
    it('should combine multiple Uint8Arrays', () => {
      const concatted = concatBytes(Uint8Array.of(1, 2), Uint8Array.of(3, 4, 5));

      expect(concatted).to.deep.equal(Uint8Array.of(1, 2, 3, 4, 5));
    });

    it('should work with empty Uint8Arrays', () => {
      const concatted = concatBytes(new Uint8Array(), Uint8Array.of(255, 128), new Uint8Array());

      expect(concatted).to.deep.equal(Uint8Array.of(255, 128));
    });

    it('should work with one or zero Uint8Arrays', () => {
      expect(concatBytes(Uint8Array.of(1))).to.deep.equal(Uint8Array.of(1));
      expect(concatBytes()).to.deep.equal(new Uint8Array());
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
