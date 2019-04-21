'use strict';

const { expect } = require('chai');
const {
  isObject,
  isEmpty,
  hasProp,
  getNested,
  setNested,
  listKeys,
  listValues,
  getTweener,
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

  describe('isEmpty', () => {
    it('should pass objects with no properties', () => {
      expect(isEmpty({})).to.be.true;
      expect(isEmpty([])).to.be.true;
      expect(isEmpty(Object.create(Date))).to.be.true;
    });

    it('should fail objects with keys', () => {
      expect(isEmpty({ a: 1 })).to.be.false;
      expect(isEmpty(['foo'])).to.be.false;
    });
  });

  describe('hasProp', () => {
    it('should pass a value with the specified own property', () => {
      expect(hasProp({ foo: 7 }, 'foo')).to.be.true;
      expect(hasProp([1, 2], 0)).to.be.true;
      expect(hasProp('foo', 2)).to.be.true;
    });

    it('should fail a value without the specified own property', () => {
      expect(hasProp({ foo: 7 }, 'bar')).to.be.false;
      expect(hasProp([1, 2], 'foo')).to.be.false;
      expect(hasProp('foo', -1)).to.be.false;
    });

    it('should fail on props inherited from the prototype chain', () => {
      expect(hasProp({}, 'toString')).to.be.false;
      expect(hasProp(new Date(), 'getTime')).to.be.false;
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

    it('should handle nested array indexes', () => {
      const obj = {
        arr: [
          null,
          true,
          {
            bar: 'baz',
          },
        ],
      };

      expect(getNested(obj, ['arr', 2, 'bar'])).to.equal('baz');
    });

    it('should return undefined if the object does not have a property', () => {
      const obj = {};
      expect(getNested(obj, ['foo'])).to.be.undefined;
    });

    it('should accept an optional default value', () => {
      const obj = {};
      expect(getNested(obj, ['foo'], 'bar')).to.equal('bar');
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

  describe('listKeys', () => {
    it('should list the sorted keys of an object', () => {
      const keys = listKeys({ foo: 1, bar: false });
      expect(keys).to.deep.equal(['bar', 'foo']);
    });

    it('should recursively list dot-separated nested keys', () => {
      const keys = listKeys({
        foo: {
          bar: {
            baz: undefined,
          },
        },
        qux: {
          quux: 7,
        },
        corge: {},
      });

      expect(keys).to.deep.equal(['corge', 'foo.bar.baz', 'qux.quux']);
    });
  });

  describe('listValues', () => {
    it('should list the values of an object, sorted by key', () => {
      const keys = listValues({ foo: 1, bar: false });
      expect(keys).to.deep.equal([false, 1]);
    });

    it('should recursively list nested values', () => {
      const keys = listValues({
        foo: {
          bar: {
            baz: undefined,
          },
        },
        qux: {
          quux: 7,
        },
        corge: {},
      });

      expect(keys).to.deep.equal([{}, undefined, 7]);
    });
  });

  describe('getTweener', () => {
    it('should take an object, a transform, a start, a duration, and return a function', () => {
      const target = { foo: 1, bar: 2 };
      expect(getTweener(target, { foo: 5 }, 1000, 100)).to.be.a('function');
    });

    it('should mutate the object with the returned tween function', () => {
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5 }, 1000, 100);

      tween(1100);

      expect(target.foo).to.equal(5);
    });

    it('should apply partial transforms to numbers', () => {
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5 }, 1000, 100);

      tween(1050);

      expect(target.foo).to.equal(3);
    });

    it('should accept multiple transform properties', () => {
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5, bar: -8 }, 1000, 100);

      tween(1050);

      expect(target.foo).to.equal(3);
      expect(target.bar).to.equal(-3);
    });

    it('should transform multiple times until the duration is complete', () => {
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5 }, 1000, 100);

      tween(1025);
      expect(target.foo).to.equal(2);

      tween(1050);
      expect(target.foo).to.equal(3);

      tween(1075);
      expect(target.foo).to.equal(4);

      tween(1100);
      expect(target.foo).to.equal(5);
    });

    it('should modify booleans, strings, and objects only once the duration has elapsed', () => {
      const obj1 = { foo: 1 };
      const obj2 = { foo: 2 };

      const target = { foo: true, bar: 'qux', baz: obj1 };
      const tween = getTweener(target, { foo: false, bar: 'quux', baz: obj2 }, 1000, 100);

      tween(1050);
      expect(target.foo).to.equal(true);
      expect(target.bar).to.equal('qux');
      expect(target.baz).to.equal(obj1);

      tween(1100);
      expect(target.foo).to.equal(false);
      expect(target.bar).to.equal('quux');
      expect(target.baz).to.equal(obj2);
    });

    it('should not apply further transforms after reaching the duration', () => {
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5 }, 1000, 100);

      tween(1500);
      expect(target.foo).to.equal(5);

      tween(2000);
      expect(target.foo).to.equal(5);

      tween(1050);
      expect(target.foo).to.equal(5);
    });

    it('should return false if the transform is not complete', () => {
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5 }, 1000, 100);

      expect(tween(1050)).to.equal(false);
    });

    it('should return true if the transform is complete', () => {
      const target = { foo: 1, bar: 2 };
      const tween = getTweener(target, { foo: 5 }, 1000, 100);

      expect(tween(1100)).to.equal(true);
    });
  });
});
