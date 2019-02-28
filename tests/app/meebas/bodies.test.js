'use strict';

const { expect } = require('chai');
const settings = require('../settings.common.js');

const oldWidth = settings.tank.width;
const oldHeight = settings.tank.height;
settings.tank.width = 100;
settings.tank.height = 100;

const {
  getRandomBody,
  replicateParent,
} = require('./bodies.common.js');

const getCircleArea = radius => Math.floor(Math.PI * radius * radius);

const expectIsValidNewBody = (body) => {
  expect(body.dna).to.match(/^[0-9A-F]{4,}$/);
  expect(body.fill).to.be.a('string');

  expect(body.radius).to.be.at.least(settings.meebas.minRadius);
  expect(body.mass).to.be.within(getCircleArea(body.radius), getCircleArea(body.radius + 1));

  expect(body.x).to.be.a('number');
  expect(body.y).to.be.a('number');

  expect(body.velocity).to.be.an('object');
  expect(body.velocity.angle).to.be.within(0, 1);
  expect(body.velocity.speed).to.be.a('number');

  expect(body.spikes).to.be.an('array');
  expect(body.meta.nextX).to.be.a('number');
  expect(body.meta.nextY).to.be.a('number');
  expect(body.meta.lastCollisionBody).to.equal(null);
};

describe('Body methods', () => {
  after(() => {
    settings.tank.width = oldWidth;
    settings.tank.height = oldHeight;
  });

  describe('getRandomBody', () => {
    it('should create a new random body', () => {
      const body = getRandomBody();

      expectIsValidNewBody(body);
      expect(body.x).to.be.within(body.radius, settings.tank.width - body.radius);
      expect(body.y).to.be.within(body.radius, settings.tank.height - body.radius);
    });
  });

  describe('replicateParent', () => {
    it('should create a body based on a parent and angle', () => {
      const parent = getRandomBody();
      parent.fill = '#f00ba6';
      parent.velocity.speed = 123;
      const child = replicateParent(parent, 0.25);

      expectIsValidNewBody(child);
      expect(child.fill).to.equal('#f00ba6');
      expect(child.velocity.angle).to.equal(0.25);
      expect(child.velocity.speed).to.equal(123);
    });
  });
});
