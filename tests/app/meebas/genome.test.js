'use strict';

const { expect } = require('chai');
const {
  createGenome,
  readGenome,
  replicateGenome,
} = require('./genome.common.js');

const CONTROL_BYTES = new Set([0xF0, 0xF1]);

const isValidControlByte = byte => CONTROL_BYTES.has(byte);

describe('View methods', () => {
  describe('createGenome', () => {
    it('should return a Uint8Array', () => {
      expect(createGenome()).to.be.an.instanceOf(Uint8Array);
    });

    it('should include at least one valid control byte', () => {
      expect(createGenome().some(isValidControlByte));
    });

    it('should generate different genomes each time it is invoked', () => {
      const genome1 = createGenome();
      const genome2 = createGenome();
      expect(genome1).to.not.deep.equal(genome2);
    });
  });

  describe('readGenome', () => {
    it('should return a command object with instructions for building meeba attributes', () => {
      const commands = readGenome(new Uint8Array());

      expect(commands).to.be.an('object');
      expect(commands).to.have.a.property('size').which.is.a('number');
      expect(commands).to.have.a.property('spikes').which.is.an('array');
    });

    it('should parse instructions for the size of a meeba', () => {
      const { size: size1 } = readGenome(Uint8Array.from([
        0b11110000,
        0b10101010,
        0b00001111,
      ]));

      const { size: size2 } = readGenome(Uint8Array.from([
        0b11110000,
        0b00000000,
        0b00000000,
      ]));

      const { size: size3 } = readGenome(Uint8Array.from([
        0b11110000,
        0b11110001,
        0b10101010,
      ]));

      const { size: size4 } = readGenome(Uint8Array.from([
        0b11110000,
        0b11100000,
        0b11110000,
        0b00000111,
      ]));

      expect(size1).to.equal(8);
      expect(size2).to.equal(0);
      expect(size3).to.equal(0);
      expect(size4).to.equal(6);
    });

    it('should parse instructions for meeba spikes', () => {
      const { spikes: spikes1 } = readGenome(Uint8Array.from([
        0b11110001,
        0b10101010,
        0b00001111,
      ]));

      const { spikes: spikes2 } = readGenome(Uint8Array.from([
        0b11110001,
        0b00000000,
        0b00000000,
      ]));

      const { spikes: spikes3 } = readGenome(Uint8Array.from([
        0b11110001,
        0b11110000,
        0b10101010,
      ]));

      const { spikes: spikes4 } = readGenome(Uint8Array.from([
        0b11110000,
        0b11110001,
        0b11100111,
        0b11110001,
        0b00000111,
      ]));

      expect(spikes1).to.deep.equal([{ length: 4, angle: 0 }]);
      expect(spikes2).to.deep.equal([{ length: 0, angle: 0 }]);
      expect(spikes3).to.deep.equal([{ length: 0, angle: 0 }]);
      expect(spikes4).to.deep.equal([
        { length: 3, angle: 0.2 },
        { length: 1, angle: 0.6 },
      ]);
    });

    it('should parse instructions for meeba hue', () => {
      const { hue: hue1 } = readGenome(Uint8Array.from([
        0b11110010,
        0b10101010,
      ]));

      const { hue: hue2 } = readGenome(Uint8Array.from([
        0b11110011,
        0b11000000,
        0b11110100,
        0b01010101,
      ]));

      const { hue: hue3 } = readGenome(Uint8Array.from([
        0b11110010,
        0b00101010,
        0b10000010,
        0b11110011,
        0b01111111,
        0b00000001,
        0b11110100,
        0b00000011,
      ]));

      const { hue: hue4 } = readGenome(Uint8Array.from([
        0b11110100,
        0b00000000,
        0b10000010,
        0b11110011,
        0b10000000,
        0b11110010,
        0b01111111,
        0b11110100,
        0b00000001,
      ]));

      expect(hue1).to.equal(0);
      expect(hue2).to.equal(210);
      expect(hue3).to.equal(90);
      expect(hue4).to.equal(340);
    });
  });

  describe('replicateGenome', () => {
    it('should return a new genome', () => {
      const oldGenome = createGenome();
      const newGenome = replicateGenome(oldGenome);

      expect(newGenome).to.be.an.instanceOf(Uint8Array);
      expect(newGenome).to.not.equal(oldGenome);
    });
  });
});
