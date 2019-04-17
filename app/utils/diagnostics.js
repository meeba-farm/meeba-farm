import {
  flatten,
  groupBy,
} from './arrays.js';

/**
 * @typedef Snapshot
 *
 * @prop {number} timestamp
 * @prop {number} meebas
 * @prop {number} motes
 * @prop {number} spikes
 * @prop {number} calories
 * @prop {number} averageSize
 * @prop {number} averageSpikes
 * @prop {number} averageSpikeLength
 * @prop {number} averageUpkeep
 * @prop {number} averageSpeed
 * @prop {number} averageMoteSpeed
 */

/**
 * @typedef {import('../simulation.js').Body} Body
 */

/**
 * @template T
 * @param {T[]} arr
 * @param {function(T): number} getValue
 * @returns {number}
 */
const sum = (arr, getValue) => arr.reduce((total, item) => total + getValue(item), 0);

/**
 * @template T
 * @param {T[]} arr
 * @param {function(T): number} getValue
 * @returns {number}
 */
const avg = (arr, getValue) => sum(arr, getValue) / arr.length;

/**
 * @param {Body} body
 * @returns {'meebas'|'motes'}
 */
const isMeebaOrMote = body => (body.dna ? 'meebas' : 'motes');

/**
 * Generate a report about the current state of the simulation
 *
 * @param {number} timestamp - the timestamp for this report
 * @param {Body[]} bodies - the currently simulated bodies
 * @returns {Snapshot}
 */
export const getSnapshot = (timestamp, bodies) => {
  const { meebas, motes } = groupBy(bodies, isMeebaOrMote);
  const spikes = flatten(meebas.map(meeba => meeba.spikes));

  return {
    timestamp,
    meebas: meebas.length,
    motes: motes.length,
    spikes: spikes.length,
    calories: sum(bodies, body => body.vitals.calories),
    averageSize: avg(meebas, meeba => meeba.mass),
    averageSpikes: avg(meebas, meeba => meeba.spikes.length),
    averageSpikeLength: avg(spikes, spike => spike.length),
    averageUpkeep: avg(meebas, meeba => meeba.vitals.upkeep),
    averageSpeed: avg(meebas, meeba => meeba.velocity.speed),
    averageMoteSpeed: avg(motes, mote => mote.velocity.speed),
  };
};

/**
 * @param {array} arr
 * @returns {string}
 */
const stringify = arr => JSON.stringify(arr).slice(1, -1);

/**
 * Generates a CSV spring from an array of objects with identical properties
 *
 * @param {array} objArray
 * @returns {string}
 */
export const toCsv = (objArray) => {
  if (objArray.length === 0) {
    return '';
  }

  const keys = Object.keys(objArray[0]).sort();
  const csValues = objArray
    .map(obj => stringify(keys.map(key => obj[key])))
    .join('\n');

  return `${stringify(keys)}\n${csValues}`;
};
