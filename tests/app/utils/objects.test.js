'use strict';

const { expect } = require('chai');
const {
  getNested,
} = require('./objects.common.js');

describe('Object utils', () => {
  describe('getNested', () => {
    it('should fetch a nested property from an object', () => {
      const obj = {
        foo: {
          bar: 7,
        },
      };

      expect(getNested(obj, ['foo', 'bar'])).to.equal(7);
    });

    it('should return undefined if the object does not have a property', () => {
      const obj = {};
      expect(getNested(obj, ['foo'])).to.be.undefined;
    });

    it('should return the object itself if the path is empty', () => {
      const obj = {};
      expect(getNested(obj, [])).to.equal(obj);
    });

    it('should return undefined if passed a primitive value with a path', () => {
      expect(getNested('foo', ['bar'])).to.be.undefined;
    });

    it('should return the value if passed a primitive with an empty path', () => {
      expect(getNested('foo', [])).to.equal('foo');
    });
  });
});
