'use strict';

const { expect } = require('chai');
const {
  getSnapshot,
} = require('./diagnostics.common.js');

const TEST_BODIES = [
  {
    dna: 'F09849F044CF070278DDBE530A4F1D9D9166666',
    fill: '#6b6e90',
    x: 100,
    y: 200,
    radius: 20,
    mass: 1256,
    velocity: {
      angle: 0.5,
      speed: 6,
    },
    vitals: {
      calories: 1500,
      upkeep: 48,
      diesAt: 628,
      spawnsAt: 2512,
      isDead: false,
    },
    spikes: [
      {
        drain: 200,
        fill: 'black',
        length: 20,
        x1: 100,
        y1: 154,
        x2: 102,
        y2: 178,
        x3: 97,
        y3: 178,
        offset: {
          x1: 0,
          y1: -46,
          x2: 2,
          y2: -22,
          x3: -3,
          y3: -22,
        },
        meta: { deactivateTime: null },
      },
    ],
    meta: {
      nextX: 100,
      nextY: 200,
      lastCollisionBody: null,
    },
  },
  {
    dna: '',
    fill: '#792',
    x: 200,
    y: 100,
    radius: 5,
    mass: 79,
    velocity: {
      angle: 0.75,
      speed: 5,
    },
    vitals: {
      calories: 158,
      upkeep: 0,
      diesAt: 0,
      spawnsAt: 9007199254740991,
      isDead: false,
    },
    spikes: [],
    meta: {
      nextX: 200,
      nextY: 100,
      lastCollisionBody: null,
    },
  },
  {
    dna: 'F09849F244CF070278DDBE530A4F1D9D9166666F1D9D91',
    fill: '#bb6e00',
    x: 200,
    y: 300,
    radius: 10,
    mass: 314,
    velocity: {
      angle: 0.25,
      speed: 12,
    },
    vitals: {
      calories: 500,
      upkeep: 24,
      diesAt: 157,
      spawnsAt: 628,
      isDead: false,
    },
    spikes: [
      {
        drain: 200,
        fill: 'black',
        length: 8,
        x1: 200,
        y1: 277,
        x2: 202,
        y2: 289,
        x3: 197,
        y3: 289,
        offset: {
          x1: 0,
          y1: -23,
          x2: 2,
          y2: -11,
          x3: -3,
          y3: -11,
        },
        meta: { deactivateTime: null },
      },
      {
        drain: 200,
        fill: 'black',
        length: 20,
        x1: 200,
        y1: 254,
        x2: 202,
        y2: 278,
        x3: 197,
        y3: 278,
        offset: {
          x1: 0,
          y1: -46,
          x2: 2,
          y2: -22,
          x3: -3,
          y3: -22,
        },
        meta: { deactivateTime: null },
      },
    ],
    meta: {
      nextX: 200,
      nextY: 300,
      lastCollisionBody: null,
    },
  },
  {
    dna: '',
    fill: '#792',
    x: 300,
    y: 200,
    radius: 5,
    mass: 79,
    velocity: {
      angle: 0.25,
      speed: 15,
    },
    vitals: {
      calories: 158,
      upkeep: 0,
      diesAt: 0,
      spawnsAt: 9007199254740991,
      isDead: false,
    },
    spikes: [],
    meta: {
      nextX: 300,
      nextY: 200,
      lastCollisionBody: null,
    },
  },
  {
    dna: '',
    fill: '#792',
    x: 200,
    y: 200,
    radius: 5,
    mass: 79,
    velocity: {
      angle: 0.5,
      speed: 25,
    },
    vitals: {
      calories: 158,
      upkeep: 0,
      diesAt: 0,
      spawnsAt: 9007199254740991,
      isDead: false,
    },
    spikes: [],
    meta: {
      nextX: 200,
      nextY: 200,
      lastCollisionBody: null,
    },
  },
];

describe('Diagnostics module', () => {
  describe('getSnapshot', () => {
    it('should generate a report summarizing the current state of the simulation', () => {
      expect(getSnapshot(123.45, TEST_BODIES)).to.deep.equal({
        timestamp: 123.45,
        meebas: 2,
        motes: 3,
        spikes: 3,
        calories: 2474,
        averageSize: 785,
        averageSpikes: 1.5,
        averageSpikeLength: 16,
        averageUpkeep: 36,
        averageSpeed: 9,
        averageMoteSpeed: 15,
      });
    });
  });
});
