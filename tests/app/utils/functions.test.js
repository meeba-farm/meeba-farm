'use strict';

const { expect } = require('chai');
const {
  pipe,
  thisFirst,
} = require('./functions.common.js');

describe('Function utils', () => {
  describe('pipe', () => {
    it('should pipe a value into a chain of functions', () => {
      const piped = pipe(-153.72)
        .into(Math.abs)
        .into(Math.sqrt)
        .into(Math.floor)
        .done();

      expect(piped).to.equal(12);
    });

    it('should return the original value if not piped', () => {
      const piped = pipe(-153.72)
        .done();

      expect(piped).to.equal(-153.72);
    });

    it('should accept additional arguments for each function', () => {
      const piped = pipe(12)
        .into(Math.max, 11)
        .into(Array.of, 13, 14)
        .done();

      expect(piped).to.deep.equal([12, 13, 14]);
    });
  });

  describe('thisFirst', () => {
    it('should return a new function that takes this as the first argument', () => {
      const firstAdd = thisFirst(function thisAdd(y) {
        return this.x + y;
      });

      expect(firstAdd({ x: 2 }, 3)).to.equal(5);
    });
  });
});
