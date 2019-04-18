'use strict';

const { expect } = require('chai');
const {
  hslToString,
} = require('./colors.common.js');

describe('Color utils', () => {
  describe('hslToString', () => {
    it('should convert an hsl object to a CSS color string', () => {
      expect(hslToString({ h: 300, s: 8, l: 99 })).to.equal('hsl(300,8%,99%)');
    });

    it('should wrap hue degrees at 360', () => {
      expect(hslToString({ h: 720, s: 100, l: 0 })).to.equal('hsl(0,100%,0%)');
      expect(hslToString({ h: -359, s: 100, l: 0 })).to.equal('hsl(1,100%,0%)');
    });

    it('should round saturation/lightness over 100 down to 100', () => {
      expect(hslToString({ h: 132, s: 999, l: Infinity })).to.equal('hsl(132,100%,100%)');
    });

    it('should round negative saturation/lightness up to 0', () => {
      expect(hslToString({ h: 232, s: -Infinity, l: -0.01 })).to.equal('hsl(232,0%,0%)');
    });

    it('should convert an hsla object to a CSS color string', () => {
      expect(hslToString({ h: 100, s: 50, l: 50, a: 0.9 })).to.equal('hsla(100,50%,50%,0.9)');
    });

    it('should round negative alphas up to 0', () => {
      expect(hslToString({ h: 0, s: 75, l: 25, a: -33 })).to.equal('hsla(0,75%,25%,0)');
    });

    it('should round alphas over 1 down to 1', () => {
      expect(hslToString({ h: 90, s: 25, l: 75, a: 17 })).to.equal('hsla(90,25%,75%,1)');
    });
  });
});
