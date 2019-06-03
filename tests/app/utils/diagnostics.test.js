'use strict';

const { expect } = require('chai');
const {
  getSnapshot,
  toCsv,
} = require('./diagnostics.common.js');

const TEST_BODIES = [
  {
    dna: 'F07849F044CF070278DDBE530A4F1D9D9166666',
    fill: {
      h: 0,
      s: 60,
      l: 50,
    },
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
        fill: {
          h: 0,
          s: 100,
          l: 0,
        },
        angle: 0,
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
      },
    ],
    meta: {
      canInteract: true,
      isSimulated: true,
    },
  },
  {
    dna: '',
    fill: {
      h: 77,
      s: 40,
      l: 50,
    },
    x: 200,
    y: 100,
    radius: 5,
    mass: 79,
    velocity: {
      angle: 0.75,
      speed: 5,
    },
    vitals: {
      calories: 63,
      upkeep: 0,
      diesAt: 0,
      spawnsAt: 159,
      isDead: false,
    },
    spikes: [],
    meta: {
      canInteract: true,
      isSimulated: true,
    },
  },
  {
    dna: 'F08849F244CF070278DDBE530A4F1D9D9166666F1D9D91',
    fill: {
      h: 120,
      s: 80,
      l: 50,
    },
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
        fill: {
          h: 0,
          s: 100,
          l: 0,
        },
        angle: 0.25,
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
      },
      {
        drain: 200,
        fill: {
          h: 0,
          s: 100,
          l: 0,
        },
        angle: 0.5,
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
      },
    ],
    meta: {
      canInteract: true,
      isSimulated: true,
    },
  },
  {
    dna: '',
    fill: {
      h: 77,
      s: 99,
      l: 50,
    },
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
      spawnsAt: 159,
      isDead: false,
    },
    spikes: [],
    meta: {
      canInteract: true,
      isSimulated: true,
    },
  },
  {
    dna: '',
    fill: {
      h: 77,
      s: 99,
      l: 50,
    },
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
      spawnsAt: 159,
      isDead: false,
    },
    spikes: [],
    meta: {
      canInteract: true,
      isSimulated: true,
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
        calories: 2379,
        spikes: 3,
        averageSize: 785,
        averageSpikes: 1.5,
        averageSpikeLength: 16,
        averageUpkeep: 36,
        averageSpeed: 9,
        averageMoteSpeed: 15,
      });
    });

    it('should generate a report with an empty set of bodies', () => {
      expect(getSnapshot(0, [])).to.deep.equal({
        timestamp: 0,
        meebas: 0,
        motes: 0,
        spikes: 0,
        calories: 0,
        averageSize: 0,
        averageSpikes: 0,
        averageSpikeLength: 0,
        averageUpkeep: 0,
        averageSpeed: 0,
        averageMoteSpeed: 0,
      });
    });
  });

  describe('toCsv', () => {
    it('should convert an array of objects into a CSV string', () => {
      const objects = [
        { foo: 1, bar: 2, baz: 'qux' },
        { foo: 3, bar: 4, baz: 'quux' },
        { foo: 5, bar: 6, baz: 'quuz' },
      ];

      expect(toCsv(objects)).to.equal('"bar","baz","foo"\n2,"qux",1\n4,"quux",3\n6,"quuz",5');
    });
  });
});
