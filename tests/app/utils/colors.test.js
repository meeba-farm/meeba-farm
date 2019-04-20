'use strict';

const { expect } = require('chai');
const {
  hslToString,
  rgbToHue,
} = require('./colors.common.js');

describe('Color utils', () => {
  describe('hslToString', () => {
    it('should convert an hsl object to a CSS color string', () => {
      expect(hslToString({ h: 300, s: 8, l: 99 })).to.equal('hsl(300,8%,99%)');
    });

    it('should drop hue information when fully desaturated', () => {
      expect(hslToString({ h: 153, s: 0, l: 87 })).to.equal('hsl(0,0%,87%)');
    });

    it('should drop hue and saturation when fully lightened or darkened', () => {
      expect(hslToString({ h: 217, s: 72, l: 0 })).to.equal('hsl(0,0%,0%)');
      expect(hslToString({ h: 2, s: 2, l: 100 })).to.equal('hsl(0,0%,100%)');
    });

    it('should wrap hue degrees at 360', () => {
      expect(hslToString({ h: 720, s: 100, l: 50 })).to.equal('hsl(0,100%,50%)');
      expect(hslToString({ h: -359, s: 100, l: 50 })).to.equal('hsl(1,100%,50%)');
    });

    it('should round saturation/lightness over 100 down to 100', () => {
      expect(hslToString({ h: 132, s: 999, l: 75 })).to.equal('hsl(132,100%,75%)');
      expect(hslToString({ h: 132, s: 50, l: Infinity })).to.equal('hsl(0,0%,100%)');
    });

    it('should round negative saturation/lightness up to 0', () => {
      expect(hslToString({ h: 232, s: -Infinity, l: 45 })).to.equal('hsl(0,0%,45%)');
      expect(hslToString({ h: 254, s: 90, l: -0.01 })).to.equal('hsl(0,0%,0%)');
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

  describe('rgbToHue', () => {
    it('should convert an rgb object to a hue value', () => {
      expect(rgbToHue({ r: 255, g: 0, b: 0 })).to.equal(0);
      expect(rgbToHue({ r: 0, g: 255, b: 0 })).to.equal(120);
      expect(rgbToHue({ r: 0, g: 0, b: 255 })).to.equal(240);

      expect(rgbToHue({ r: 255, g: 255, b: 0 })).to.equal(60);
      expect(rgbToHue({ r: 0, g: 255, b: 255 })).to.equal(180);
      expect(rgbToHue({ r: 255, g: 0, b: 255 })).to.equal(300);

      expect(rgbToHue({ r: 255, g: 255, b: 255 })).to.equal(0);
      expect(rgbToHue({ r: 0, g: 0, b: 0 })).to.equal(0);
      expect(rgbToHue({ r: 128, g: 128, b: 128 })).to.equal(0);

      expect(rgbToHue({ r: 128, g: 255, b: 0 })).to.equal(90);
      expect(rgbToHue({ r: 240, g: 8, b: 167 })).to.equal(319);
    });
  });
});
