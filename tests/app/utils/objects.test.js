'use strict';

const { expect } = require('chai');
const {
  isObject,
  getNested,
  setNested,
} = require('./objects.common.js');

describe('Object utils', () => {
  describe('isObject', () => {
    it('should pass objects', () => {
      expect(isObject({ a: 1 })).to.be.true;
      expect(isObject([])).to.be.true;
      expect(isObject(new Date())).to.be.true;
    });

    it('should fail primitives', () => {
      expect(isObject('foo')).to.be.false;
      expect(isObject(7)).to.be.false;
      expect(isObject(true)).to.be.false;
      expect(isObject(undefined)).to.be.false;
    });

    it('should fail null', () => {
      expect(isObject(null)).to.be.false;
    });
  });

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

  describe('setNested', () => {
    it('should set a nested property on an object', () => {
      const obj = { foo: {} };

      setNested(obj, ['foo', 'bar'], 7);

      expect(obj).to.deep.equal({
        foo: {
          bar: 7,
        },
      });
    });

    it('should overwrite an existing property', () => {
      const foo = { bar: false };
      const obj = { foo };

      setNested(obj, ['foo', 'bar'], true);

      expect(obj.foo.bar).to.equal(true);
      expect(obj.foo).to.equal(foo);
    });

    it('should create nested objects as needed', () => {
      const obj = {};

      setNested(obj, ['foo', 'bar'], 'baz');

      expect(obj.foo).to.be.an('object');
      expect(obj.foo.bar).to.equal('baz');
    });

    it('should overwrite nested primitives with objects as needed', () => {
      const obj = { foo: 7 };

      setNested(obj, ['foo', 'bar'], 'baz');

      expect(obj.foo).to.deep.equal({ bar: 'baz' });
    });

    it('should do nothing if passed an empty path', () => {
      const obj = { foo: 7 };

      setNested(obj, [], 'bar');

      expect(obj).to.deep.equal({ foo: 7 });
    });
  });
});
