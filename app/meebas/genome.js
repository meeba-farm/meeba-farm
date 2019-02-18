import * as settings from '../settings.js';
import { range, flatten } from '../utils/arrays.js';
import { randInt } from '../utils/math.js';

/**
 * Instructions for building a meeba
 *
 * @typedef Commands
 * @prop {number} mass - the mass/area of the meeba
 * @prop {SpikeCommand[]} spikes - the spikes to attach to the meeba
 */

/**
 * Instructions for building a spike
 *
 * @typedef SpikeCommand
 * @prop {number} length - length of spike in pixels
 * @prop {number} angle - position around meeba circumference (in turns)
 */

/**
 * Called when iterating over a genome and encountering a new gene. Returns
 * the appropriate reader function for the following bytes
 *
 * @callback GeneReader
 * @param {Commands} commands - commands object to update; mutated!
 * @param {number} [start] - the index of the control byte
 * @param {Uint8Array} [genome] - the full genome
 * @returns {ByteReader}
 */

/**
 * Reads a byte and modifies a command object as needed
 *
 * @callback ByteReader
 * @param {number} [byte]
 */

const { averageStartingGeneCount, averageStartingGeneSize } = settings.meebas;
const MAX_GENES = 2 * averageStartingGeneCount;
const MAX_BYTES = 2 * averageStartingGeneSize;

const CONTROL_BYTE_FREQUENCY = [0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF0, 0xF1];

const BITS_PER_MASS_PIXEL = 1;
const BITS_PER_SPIKE_LENGTH = 2;

/**
 * Returns a gene with a control byte followed a random number of
 * randomly generated bytes (not yet formatted as a Uint8Array)
 *
 * @returns {number[]}
 */
const randGene = () => {
  const type = CONTROL_BYTE_FREQUENCY[
    randInt(0, CONTROL_BYTE_FREQUENCY.length)
  ];
  const body = range(randInt(1, MAX_BYTES)).map(() => randInt(0, 256));
  return [type].concat(body);
};

/**
 * Creates a new random genome encoded as a Uint8Array
 *
 * @returns {Uint8Array}
 */
export const createGenome = () => {
  const genes = range(randInt(1, MAX_GENES)).map(randGene);
  return Uint8Array.from(flatten(genes));
};

/**
 * Count the number of 1 bits in a byte
 *
 * @param {number} byte
 * @returns {number} - number of 1's
 */
const countBits = byte => byte
  .toString(2)
  .split('')
  .filter(bit => bit === '1')
  .length;

// eslint-disable-next-line valid-jsdoc
/** @type {GeneReader} */
const getSizeReader = (commands) => (byte) => {
  commands.mass += countBits(byte) * BITS_PER_MASS_PIXEL;
};

// eslint-disable-next-line valid-jsdoc
/** @type {GeneReader} */
const getSpikeReader = (commands, start, genome) => {
  const spike = { length: 0, angle: start / genome.length };
  commands.spikes.push(spike);

  return (byte) => {
    spike.length += Math.floor(countBits(byte) / BITS_PER_SPIKE_LENGTH);
  };
};

/** @type {ByteReader} */
const noopReader = () => {};

/** @type {Object<string, GeneReader>} */
const GENE_READERS = {
  0xF0: getSizeReader,
  0xF1: getSpikeReader,
};

/**
 * Interprets a genome, returning a command object with instructions
 * for building a meeba based on the encoded genes
 *
 * @param {Uint8Array} genome
 * @returns {Commands}
 */
export const readGenome = (genome) => {
  /** @type {Commands} */
  const commands = {
    mass: 0,
    spikes: [],
  };
  let read = noopReader;

  genome.forEach((byte, i) => {
    if (byte >= 0xF0) {
      read = GENE_READERS[byte]
        ? GENE_READERS[byte](commands, i, genome)
        : noopReader;
    } else {
      read(byte);
    }
  });

  return commands;
};

/**
 * Creates a mutated copy of an existing genome
 *
 * @param {Uint8Array} genome
 * @returns {Uint8Array}
 */
export const replicateGenome = (genome) => {
  const newGenome = [];

  // Perfect replication for now
  // Use a for-with-semicolons to "mutate" i
  for (let i = 0; i < genome.length; i += 1) {
    newGenome.push(genome[i]);
  }

  return Uint8Array.from(newGenome);
};