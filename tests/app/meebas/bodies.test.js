'use strict';

const { expect } = require('chai');
const {
  settings,
  updateSetting,
} = require('../settings.common.js');
const {
  getRandomBody,
  replicateParent,
  spawnMote,
} = require('./bodies.common.js');

const getCircleArea = radius => Math.floor(Math.PI * radius * radius);

const expectIsValidNewBody = (body) => {
  expect(body.dna).to.match(/^[0-9A-F]*$/);
  expect(body.fill).to.be.an('object');
  expect(body.fill.h).to.be.within(0, 360);
  expect(body.fill.s).to.be.within(0, 100);
  expect(body.fill.l).to.be.within(0, 100);


  expect(body.radius).to.be.a('number').greaterThan(0);
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
  const oldWidth = settings.core.width;
  const oldHeight = settings.core.height;

  beforeEach(() => {
    updateSetting('width', 100);
    updateSetting('height', 100);
  });

  afterEach(() => {
    updateSetting('width', oldWidth);
    updateSetting('height', oldHeight);
  });

  describe('getRandomBody', () => {
    it('should create a new random body', () => {
      const body = getRandomBody();

      expectIsValidNewBody(body);
      expect(body.x).to.be.within(body.radius, settings.core.width - body.radius);
      expect(body.y).to.be.within(body.radius, settings.core.height - body.radius);
    });
  });

  describe('replicateParent', () => {
    it('should create a body based on a parent and angle', () => {
      const parent = getRandomBody();
      parent.velocity.speed = 123;
      const child = replicateParent(parent, 0.25);

      expectIsValidNewBody(child);
      expect(child.velocity.angle).to.equal(0.25);
      expect(child.velocity.speed).to.be.at.least(123);
    });
  });

  describe('spawnMote', () => {
    it('should create a new random mote', () => {
      const mote = spawnMote();

      expectIsValidNewBody(mote);
      expect(mote.dna).to.equal('');
      expect(mote.vitals.upkeep).to.equal(0);
    });
  });
});
