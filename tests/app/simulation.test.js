'use strict';

const { expect } = require('chai');
const {
  settings,
  updateSetting,
} = require('./settings.common.js');
const {
  getRandomBody,
} = require('./meebas/bodies.common.js');
const {
  separateBodies,
  simulateFrame,
} = require('./simulation.common.js');

const sqr = n => n * n;
const getCircleArea = radius => Math.floor(Math.PI * radius * radius);

describe('Simulation methods', () => {
  const oldWidth = settings.core.width;
  const oldHeight = settings.core.height;
  const oldRate = settings.core.moteSpawnRate;

  beforeEach(() => {
    updateSetting('width', 100);
    updateSetting('height', 100);
    updateSetting('moteSpawnRate', 0);
  });

  afterEach(() => {
    updateSetting('width', oldWidth);
    updateSetting('height', oldHeight);
    updateSetting('moteSpawnRate', oldRate);
  });

  describe('separateBodies', () => {
    it('should separate overlapping bodies', () => {
      const body1 = { ...getRandomBody(), x: 45, y: 50, radius: 10 };
      const body2 = { ...getRandomBody(), x: 55, y: 50, radius: 10 };

      separateBodies([body1, body2]);

      const separation = Math.sqrt(sqr(body1.x - body2.x) + sqr(body1.y - body2.y));
      expect(separation).to.be.at.least(20);
    });

    it('should fail gracefully if no solution is possible', () => {
      const body1 = { x: 50, y: 50, radius: 1000 };
      const body2 = { x: 50, y: 50, radius: 1000 };

      expect(() => separateBodies([body1, body2])).to.not.throw();
    });
  });

  describe('simulateFrame', () => {
    it('should simulate movement over time', () => {
      const body = {
        ...getRandomBody(),
        radius: 10,
        mass: getCircleArea(10),
        x: 50,
        y: 50,
        velocity: {
          angle: 0,
          speed: 100,
        },
      };

      let bodies = simulateFrame([body], 0, 100);
      expect(bodies[0].x).to.equal(60);
      expect(bodies[0].y).to.equal(50);

      bodies = simulateFrame(bodies, 100, 200);
      bodies = simulateFrame(bodies, 200, 300);
      expect(bodies[0].x).to.equal(80);
      expect(bodies[0].y).to.equal(50);
    });

    it('should simulate wall bounces', () => {
      const body = {
        ...getRandomBody(),
        radius: 10,
        mass: getCircleArea(10),
        x: 15,
        y: 50,
        velocity: {
          angle: 0.5,
          speed: 100,
        },
      };

      const bodies = simulateFrame([body], 0, 100);

      expect(bodies[0].velocity.angle).to.equal(0);
      expect(bodies[0].velocity.speed).to.equal(100);
    });

    it('should simulate body collisions', () => {
      const body1 = {
        ...getRandomBody(),
        radius: 10,
        mass: getCircleArea(10),
        x: 35,
        y: 50,
        velocity: {
          angle: 0,
          speed: 100,
        },
      };

      const body2 = {
        ...getRandomBody(),
        radius: 10,
        mass: getCircleArea(10),
        x: 65,
        y: 50,
        velocity: {
          angle: 0.5,
          speed: 100,
        },
      };

      const bodies = simulateFrame([body1, body2], 0, 100);

      expect(bodies[0].velocity.angle).to.equal(0.5);
      expect(bodies[0].velocity.speed).to.equal(100);

      expect(bodies[1].velocity.angle).to.equal(0);
      expect(bodies[1].velocity.speed).to.equal(100);
    });

    it('should throttle frames to be no longer than 100ms', () => {
      const body = {
        ...getRandomBody(),
        radius: 10,
        mass: getCircleArea(10),
        x: 50,
        y: 50,
        velocity: {
          angle: 0,
          speed: 100,
        },
      };

      const bodies = simulateFrame([body], 0, 1000);
      expect(bodies[0].x).to.equal(60);
      expect(bodies[0].y).to.equal(50);
    });
  });
});
