'use strict';

const { expect } = require('chai');
const view = require('./view.common.js');

describe('View methods', () => {
  describe('createView', () => {
    it('should exist', () => {
      // Any further testing of these DOM heavy methods should happen in the browser
      expect(view.createView).to.exist.and.be.a('function');
    });
  });

  describe('getViewClearer', () => {
    it('should exist and return a function', () => {
      expect(view.getViewClearer).to.exist.and.be.a('function');
      expect(view.getViewClearer()).to.be.a('function');
    });
  });

  describe('getCircleDrawer', () => {
    it('should exist and return a function', () => {
      expect(view.getCircleDrawer).to.exist.and.be.a('function');
      expect(view.getCircleDrawer()).to.be.a('function');
    });
  });

  describe('getTriangleDrawer', () => {
    it('should exist and return a function', () => {
      expect(view.getTriangleDrawer).to.exist.and.be.a('function');
      expect(view.getTriangleDrawer()).to.be.a('function');
    });
  });
});
