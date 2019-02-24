'use strict';

const { expect } = require('chai');
const settings = require('./settings.common.js');

const oldWidth = settings.tank.width;
const oldHeight = settings.tank.height;
settings.tank.width = 100;
settings.tank.height = 100;

const {
  getRandomBody,
  separateBodies,
  simulateFrame,
} = require('./simulation.common.js');

const sqr = n => n * n;
const getCircleArea = radius => Math.floor(Math.PI * radius * radius);

describe('Simulation methods', () => {
  after(() => {
    settings.tank.width = oldWidth;
    settings.tank.height = oldHeight;
  });

  describe('getRandomBody', () => {
    it('should create a new body', () => {
      const body = getRandomBody();

      expect(body.dna).to.match(/^[0-9A-F]{4,}$/);
      expect(body.fill).to.be.a('string');

      expect(body.radius).to.be.at.least(settings.meebas.minRadius);
      expect(body.mass).to.be.within(getCircleArea(body.radius), getCircleArea(body.radius + 1));

      expect(body.x).to.be.within(body.radius, settings.tank.width - body.radius);
      expect(body.y).to.be.within(body.radius, settings.tank.height - body.radius);

      expect(body.velocity).to.be.an('object');
      expect(body.velocity.angle).to.be.within(0, 1);
      expect(body.velocity.speed).to.be.a('number');

      expect(body.spikes).to.be.an('array');
      expect(body.meta.nextX).to.be.a('number');
      expect(body.meta.nextY).to.be.a('number');
      expect(body.meta.lastCollisionBody).to.equal(null);
    });
  });

  describe('separateBodies', () => {
    it('should separate overlapping bodies', () => {
      const body1 = getRandomBody();
      body1.radius = 10;
      body1.x = 45;
      body1.y = 50;

      const body2 = getRandomBody();
      body2.radius = 10;
      body2.x = 55;
      body2.y = 50;

      separateBodies([body1, body2]);

      const separation = Math.sqrt(sqr(body1.x - body2.x) + sqr(body1.y - body2.y));
      expect(separation).to.be.at.least(20);
    });

    it('should fail gracefully if no solution is possible', () => {
      const body1 = getRandomBody();
      body1.radius = 1000;
      body1.x = 50;
      body1.y = 50;

      const body2 = getRandomBody();
      body2.radius = 1000;
      body2.x = 50;
      body2.y = 50;

      expect(() => separateBodies([body1, body2])).to.not.throw();
    });
  });

  describe('simulateFrame', () => {
    it('should simulate movement over time', () => {
      const body = getRandomBody();
      body.radius = 10;
      body.mass = getCircleArea(10);
      body.x = 50;
      body.y = 50;
      body.velocity.angle = 0;
      body.velocity.speed = 10;

      let bodies = simulateFrame([body], 0, 1000);
      expect(bodies[0].x).to.equal(60);
      expect(bodies[0].y).to.equal(50);

      bodies = simulateFrame(bodies, 1000, 2000);
      bodies = simulateFrame(bodies, 2000, 3000);
      expect(bodies[0].x).to.equal(80);
      expect(bodies[0].y).to.equal(50);
    });

    it('should simulate wall bounces', () => {
      const body = getRandomBody();
      body.radius = 10;
      body.mass = getCircleArea(10);
      body.x = 15;
      body.y = 50;
      body.velocity.angle = 0.5;
      body.velocity.speed = 10;

      const bodies = simulateFrame([body], 0, 1000);

      expect(bodies[0].velocity.angle).to.equal(0);
      expect(bodies[0].velocity.speed).to.equal(10);
    });

    it('should simulate body collisions', () => {
      const body1 = getRandomBody();
      body1.radius = 10;
      body1.mass = getCircleArea(10);
      body1.x = 35;
      body1.y = 50;
      body1.velocity.angle = 0;
      body1.velocity.speed = 10;

      const body2 = getRandomBody();
      body2.radius = 10;
      body2.mass = getCircleArea(10);
      body2.x = 65;
      body2.y = 50;
      body2.velocity.angle = 0.5;
      body2.velocity.speed = 10;

      const bodies = simulateFrame([body1, body2], 0, 1000);

      expect(bodies[0].velocity.angle).to.equal(0.5);
      expect(bodies[0].velocity.speed).to.equal(10);

      expect(bodies[1].velocity.angle).to.equal(0);
      expect(bodies[1].velocity.speed).to.equal(10);
    });
  });
});
