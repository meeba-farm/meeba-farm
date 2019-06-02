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
  simulateFrame,
} = require('./simulation.common.js');

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

  describe('simulateFrame', () => {
    it('should simulate movement over time', () => {
      let bodies = [
        {
          ...getRandomBody(),
          radius: 10,
          mass: getCircleArea(10),
          x: 50,
          y: 50,
          velocity: {
            angle: 0,
            speed: 100,
          },
        },
      ];

      bodies = simulateFrame(bodies, 0, 100);
      expect(bodies[0].x).to.equal(60);
      expect(bodies[0].y).to.equal(50);

      bodies = simulateFrame(bodies, 100, 200);
      bodies = simulateFrame(bodies, 200, 300);
      expect(bodies[0].x).to.equal(80);
      expect(bodies[0].y).to.equal(50);
    });

    it('should simulate wall bounces', () => {
      let bodies = [
        {
          ...getRandomBody(),
          radius: 10,
          mass: getCircleArea(10),
          x: 15,
          y: 50,
          velocity: {
            angle: 0.5,
            speed: 100,
          },
        },
      ];

      bodies = simulateFrame(bodies, 0, 100);
      bodies = simulateFrame(bodies, 0, 101);

      expect(bodies[0].velocity.angle).to.equal(0);
      expect(bodies[0].velocity.speed).to.equal(100);
    });

    it('should simulate body collisions', () => {
      let bodies = [
        {
          ...getRandomBody(),
          radius: 10,
          mass: getCircleArea(10),
          x: 35,
          y: 50,
          velocity: {
            angle: 0,
            speed: 100,
          },
        },
        {
          ...getRandomBody(),
          radius: 10,
          mass: getCircleArea(10),
          x: 65,
          y: 50,
          velocity: {
            angle: 0.5,
            speed: 100,
          },
        },
      ];

      bodies = simulateFrame(bodies, 0, 100);
      bodies = simulateFrame(bodies, 0, 101);

      expect(bodies[0].velocity.angle).to.equal(0.5);
      expect(bodies[0].velocity.speed).to.equal(100);

      expect(bodies[1].velocity.angle).to.equal(0);
      expect(bodies[1].velocity.speed).to.equal(100);
    });

    it('should throttle frames to be no longer than 100ms', () => {
      let bodies = [
        {
          ...getRandomBody(),
          radius: 10,
          mass: getCircleArea(10),
          x: 50,
          y: 50,
          velocity: {
            angle: 0,
            speed: 100,
          },
        },
      ];

      bodies = simulateFrame(bodies, 0, 1000);
      expect(bodies[0].x).to.equal(60);
      expect(bodies[0].y).to.equal(50);
    });
  });
});
