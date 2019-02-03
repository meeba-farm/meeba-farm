'use strict';

const { expect } = require('chai');
const {
  createGenome,
  readGenome,
} = require('./genome.common.js');

const CONTROL_BYTES = new Set([0xF0]);

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
      expect(commands).to.have.a.property('mass').which.is.a('number');
    });

    it('should parse instructions for the mass of a meeba', () => {
      const { mass: mass1 } = readGenome(Uint8Array.from([
        0b11110000,
        0b10101010,
        0b00001111,
      ]));

      const { mass: mass2 } = readGenome(Uint8Array.from([
        0b11110000,
        0b00000000,
        0b00000000,
      ]));

      const { mass: mass3 } = readGenome(Uint8Array.from([
        0b11110000,
        0b11110001,
        0b10101010,
      ]));

      const { mass: mass4 } = readGenome(Uint8Array.from([
        0b11110000,
        0b11100000,
        0b11110000,
        0b00000111,
      ]));

      expect(mass1).to.equal(8);
      expect(mass2).to.equal(0);
      expect(mass3).to.equal(0);
      expect(mass4).to.equal(6);
    });
  });
});
