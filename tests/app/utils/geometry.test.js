'use strict';

const { expect } = require('chai');
const {
  isShorter,
  isCloser,
  snapCircleToEdge,
} = require('./geometry.common.js');

describe('Geometry utils', () => {
  describe('isShorter', () => {
    it('should compare the length of line segment to a set distance', () => {
      expect(isShorter({ x1: 0, y1: 0, x2: 3, y2: 0 }, 4)).to.be.true;
      expect(isShorter({ x1: 0, y1: 0, x2: 3, y2: 0 }, 2)).to.be.false;

      expect(isShorter({ x1: 10, y1: 10, x2: 10, y2: 20 }, 11)).to.be.true;
      expect(isShorter({ x1: 10, y1: 10, x2: 10, y2: 20 }, 9)).to.be.false;

      expect(isShorter({ x1: 1, y1: 1, x2: 2, y2: 2 }, 1.415)).to.be.true;
      expect(isShorter({ x1: 1, y1: 1, x2: 2, y2: 2 }, 1.413)).to.be.false;

      expect(isShorter({ x1: 120, y1: 83, x2: 572, y2: 313 }, 508)).to.be.true;
      expect(isShorter({ x1: 120, y1: 83, x2: 572, y2: 313 }, 506)).to.be.false;
    });
  });

  describe('isCloser', () => {
    it('should compare the shortest distance between a point a line to a set distance', () => {
      expect(isCloser({ x: 2, y: 3 }, { x1: 0, y1: 0, x2: 4, y2: 0 }, 4)).to.be.true;
      expect(isCloser({ x: 2, y: 3 }, { x1: 0, y1: 0, x2: 4, y2: 0 }, 2)).to.be.false;

      expect(isCloser({ x: 20, y: 15 }, { x1: 10, y1: 10, x2: 10, y2: 20 }, 11)).to.be.true;
      expect(isCloser({ x: 20, y: 15 }, { x1: 10, y1: 10, x2: 10, y2: 20 }, 9)).to.be.false;

      expect(isCloser({ x: 2, y: 1 }, { x1: 1, y1: 1, x2: 2, y2: 2 }, 0.708)).to.be.true;
      expect(isCloser({ x: 2, y: 1 }, { x1: 1, y1: 1, x2: 2, y2: 2 }, 0.706)).to.be.false;
    });

    it('should compare the shortest distance when the point is beyond the line', () => {
      expect(isCloser({ x: 7, y: 0 }, { x1: 0, y1: 0, x2: 4, y2: 0 }, 4)).to.be.true;
      expect(isCloser({ x: 7, y: 0 }, { x1: 0, y1: 0, x2: 4, y2: 0 }, 2)).to.be.false;

      expect(isCloser({ x: 10, y: 0 }, { x1: 10, y1: 10, x2: 10, y2: 20 }, 11)).to.be.true;
      expect(isCloser({ x: 10, y: 0 }, { x1: 10, y1: 10, x2: 10, y2: 20 }, 9)).to.be.false;

      expect(isCloser({ x: 3, y: 3 }, { x1: 1, y1: 1, x2: 2, y2: 2 }, 1.415)).to.be.true;
      expect(isCloser({ x: 3, y: 3 }, { x1: 1, y1: 1, x2: 2, y2: 2 }, 1.414)).to.be.false;
    });

    it('should compare the shortest distance when the line has a length of zero', () => {
      expect(isCloser({ x: 95, y: 95 }, { x1: 100, y1: 100, x2: 100, y2: 100 }, 7.08)).to.be.true;
      expect(isCloser({ x: 95, y: 95 }, { x1: 100, y1: 100, x2: 100, y2: 100 }, 7.06)).to.be.false;
    });
  });

  describe('snapCircleToEdge', () => {
    it('should move a circle that overlaps with target circle', () => {
      const target = { x: 10, y: 10, radius: 8 };
      const other = { x: 10, y: 20, radius: 5 };

      snapCircleToEdge(target, other);

      expect(target).to.deep.equal({ x: 10, y: 10, radius: 8 });
      expect(other).to.deep.equal({ x: 10, y: 23, radius: 5 });
    });

    it('should optionally leave a gap between the circles', () => {
      const target = { x: 10, y: 10, radius: 8 };
      const other = { x: 10, y: 20, radius: 5 };

      snapCircleToEdge(target, other, 1);

      expect(target).to.deep.equal({ x: 10, y: 10, radius: 8 });
      expect(other).to.deep.equal({ x: 10, y: 24, radius: 5 });
    });

    it('should move a circle which does not overlap', () => {
      const target = { x: 10, y: 10, radius: 8 };
      const other = { x: 10, y: 50, radius: 5 };

      snapCircleToEdge(target, other);

      expect(target).to.deep.equal({ x: 10, y: 10, radius: 8 });
      expect(other).to.deep.equal({ x: 10, y: 23, radius: 5 });
    });

    it('should handle overlaps on diagonals', () => {
      const target = { x: 31.4, y: 42, radius: 13 };
      const other = { x: 36.7, y: 39, radius: 7.2 };

      snapCircleToEdge(target, other);

      expect(target).to.deep.equal({ x: 31.4, y: 42, radius: 13 });
      expect(other).to.deep.equal({
        x: 49.03651856404946,
        y: 32.1514867650016,
        radius: 7.2,
      });
    });
  });
});
