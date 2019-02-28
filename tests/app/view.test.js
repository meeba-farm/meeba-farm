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

  describe('getFrameRenderer', () => {
    it('should exist and return a function', () => {
      const canvas = { getContext: () => 'foo' };

      expect(view.getFrameRenderer).to.exist.and.be.a('function');
      expect(view.getFrameRenderer(canvas)).to.be.a('function');
    });
  });
});
