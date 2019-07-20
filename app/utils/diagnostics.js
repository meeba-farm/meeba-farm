import {
  flatMap,
  groupBy,
} from './arrays.js';
import {
  sum,
  minimum,
  maximum,
  mean,
  mode,
} from './math.js';
import {
  listKeys,
  listValues,
} from './objects.js';

/**
 * @typedef PropertyStats
 *
 * @prop {number} min
 * @prop {number} max
 * @prop {number} mean
 * @prop {number} mode
 */

/**
 * @typedef Snapshot
 *
 * @prop {number} timestamp
 * @prop {number} meebas
 * @prop {number} motes
 * @prop {number} calories
 * @prop {PropertyStats} size
 * @prop {PropertyStats} spikeCount
 * @prop {PropertyStats} spikeLength
 * @prop {PropertyStats} upkeep
 * @prop {PropertyStats} speed
 */

/**
 * @typedef {import('../simulation.js').Body} Body
 */

/**
 * @param {Body} body
 * @returns {'meebas'|'motes'|'corpses'}
 */
const getBodyCategory = (body) => {
  if (!body.dna) {
    return 'motes';
  }

  if (body.vitals.isDead) {
    return 'corpses';
  }

  return 'meebas';
};

/**
 * @param {number[]} values - the assorted values a particular property
 * @returns {PropertyStats}
 */
const analyzeProperty = values => ({
  min: minimum(values),
  max: maximum(values),
  mean: mean(values),
  mode: mode(values),
});

/**
 * Generate a report about the current state of the simulation
 *
 * @param {number} timestamp - the timestamp for this report
 * @param {Body[]} bodies - the currently simulated bodies
 * @returns {Snapshot}
 */
export const getSnapshot = (timestamp, bodies) => {
  const {
    meebas = /** @type {Body[]} */ ([]),
    motes = /** @type {Body[]} */ ([]),
  } = groupBy(bodies, getBodyCategory);
  const spikes = flatMap(meebas, meeba => meeba.spikes);

  return {
    timestamp,
    meebas: meebas.length,
    motes: motes.length,
    calories: sum(bodies.map(body => body.vitals.calories)),
    size: analyzeProperty(meebas.map(meeba => meeba.mass)),
    spikeCount: analyzeProperty(meebas.map(meeba => meeba.spikes.length)),
    spikeLength: analyzeProperty(spikes.map(spike => spike.length)),
    upkeep: analyzeProperty(meebas.map(meeba => meeba.vitals.upkeep)),
    speed: analyzeProperty(meebas.map(meeba => meeba.velocity.speed)),
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

  const keys = listKeys(objArray[0]);
  const csValues = objArray
    .map(obj => stringify(listValues(obj)))
    .join('\n');

  return `${stringify(keys)}\n${csValues}`;
};
