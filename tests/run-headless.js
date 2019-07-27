'use strict';

const { writeFileSync } = require('fs');
const { resolve } = require('path');
const { stubWindow } = require('./utils/browser-interop.js');

stubWindow();

const {
  settings,
  restoreDefaultSettings,
} = require('./app/settings.common.js');
const {
  simulateFrame,
} = require('./app/simulation.common.js');
const {
  getRandomBody,
} = require('./app/meebas/bodies.common.js');
const {
  range,
  groupBy,
} = require('./app/utils/arrays.common.js');
const {
  getSnapshot,
  toCsv,
} = require('./app/utils/diagnostics.common.js');
const {
  seedPrng,
} = require('./app/utils/math.common.js');
const {
  listKeys,
  listValues,
  fromLists,
} = require('./app/utils/objects.common.js');

const SEC = 1000;
const MIN = 60 * SEC;
const HR = 60 * MIN;

const REPORT_DIR = resolve(__dirname, './reports');
const SNAPSHOT_FREQUENCY = 5 * SEC;
const LOG_TIMES = [0, 5 * MIN, 20 * MIN, 1 * HR, 4 * HR, 12 * HR];

const COLOR_CODES = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  yellow: '\x1b[33m',
};

const intToString = (int, length = 0) => Math.floor(int).toString().padStart(length, '0');

const msToTime = (ms) => {
  const hours = Math.floor(ms / HR);
  const minutes = intToString((ms % HR) / MIN, 2);
  const seconds = intToString((ms % MIN) / SEC, 2);
  return `${hours}:${minutes}:${seconds}`;
};

const logInPlace = (message) => {
  process.stdout.cursorTo(0);
  process.stdout.write(message);
};

const logFormatted = (...args) => {
  const { messages, formatting } = groupBy(args, (_, i) => (
    i % 2 === 0 ? 'messages' : 'formatting'
  ));

  const formatString = messages
    .map((message, i) => {
      const formatKeys = formatting[i] || [];
      const formatCodes = formatKeys.map(key => COLOR_CODES[key]);
      return `${formatCodes.join('')}%s`;
    })
    .concat(COLOR_CODES.reset)
    .join('');

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(formatString, ...messages);
};

const logKeyVal = (key, val) => logFormatted(`${key}: `, [], val, ['dim']);

const truncate = val => Math.floor(val * 100) / 100;
const logTruncated = (key, val) => logKeyVal(key, truncate(val));
const padTruncated = (val, size) => String(truncate(val)).padStart(size, ' ');

const logSnapshot = ({ timestamp, meebas, motes, calories, ...propStats }) => {
  logTruncated('timestamp', timestamp);
  logTruncated('meebas', meebas);
  logTruncated('motes', motes);
  logTruncated('calories', calories);

  logFormatted('-------------+---------+---------+---------+---------', []);
  logFormatted('Prop Stats   |   min   |   max   |   mean  |   mode  ', []);
  logFormatted('-------------+---------+---------+---------+---------', []);

  for (const [prop, stats] of Object.entries(propStats)) {
    logFormatted(
      prop.padEnd(12, ' '), [],
      ' | ', [],
      padTruncated(stats.min, 7), ['dim'],
      ' | ', ['reset'],
      padTruncated(stats.max, 7), ['dim'],
      ' | ', ['reset'],
      padTruncated(stats.mean, 7), ['dim'],
      ' | ', ['reset'],
      padTruncated(stats.mode, 7), ['dim'],
    );
  }
};

const getReportPath = (...identifiers) => `headless-${identifiers.join('-')}.csv`;

const flattenSnapshot = (snapshot) => {
  // Get snapshot keys camelCased instead of dot-separated
  const snapshotKeys = listKeys(snapshot)
    .map(key => key.replace(/\.(.)/g, (_, first) => first.toUpperCase()));
  const snapshotValues = listValues(snapshot);
  return fromLists(snapshotKeys, snapshotValues);
};

const writeReport = (path, snapshots) => {
  const report = toCsv(snapshots.map(flattenSnapshot));
  writeFileSync(resolve(REPORT_DIR, path), report);
};

const run = (duration, width, height, framerate) => {
  const start = Date.now();
  const frameDuration = 1 / framerate * SEC;

  const name = `${width}x${height} @ ${framerate} Hz`;
  logFormatted(`>>>>>> ${name} START <<<<<<`, ['bright', 'yellow']);

  global.innerWidth = width;
  global.innerHeight = height;
  restoreDefaultSettings();

  const { seed } = settings.core;
  seedPrng(seed);
  logKeyVal('seed', seed);
  console.log();

  const snapshots = [];
  let bodies = range(settings.core.startingMeebaCount).map(getRandomBody);

  let time = 0;
  let nextSnapshot = 0;
  let nextLog = 0;

  while (time < duration) {
    bodies = simulateFrame(bodies, time, frameDuration);
    time += frameDuration;

    if (time > nextSnapshot) {
      logInPlace(`${name} - ${msToTime(time)}`);

      const snapshot = getSnapshot(time, bodies);
      snapshots.push(snapshot);
      nextSnapshot += SNAPSHOT_FREQUENCY;

      if (snapshot.meebas === 0) {
        logFormatted(`<<<<<< ${name} EXTINCTION >>>>>>`, ['bright', 'red']);
        logFormatted('Final Snapshot: ', ['bright', 'red']);
        logSnapshot(snapshots[snapshots.length - 2]);
        console.log();

        logFormatted('Duration: ', ['bright', 'red'], msToTime(time), ['reset']);
        const completeTime = msToTime(Date.now() - start);
        logFormatted('Time to Complete: ', ['bright', 'red'], completeTime, ['reset']);

        const reportPath = getReportPath(width, height, framerate, seed);
        logFormatted('Writing report: ', ['bright', 'red'], reportPath, ['reset']);
        writeReport(reportPath, snapshots);

        console.log();
        process.exit(1);
      }
    }

    if (time > LOG_TIMES[nextLog]) {
      logFormatted(`------ ${name} - ${msToTime(time)} ------`, ['bright', 'white']);
      logSnapshot(snapshots[snapshots.length - 1]);
      console.log();
      nextLog += 1;
    }
  }

  logFormatted(`>>>>>> ${name} COMPLETE <<<<<<`, ['bright', 'yellow']);
  logFormatted('Final Snapshot: ', ['bright', 'yellow']);
  logSnapshot(snapshots[snapshots.length - 1]);
  console.log();

  logFormatted('Duration: ', ['bright', 'yellow'], msToTime(duration), ['reset']);
  logFormatted('Time to Complete: ', ['bright', 'yellow'], msToTime(Date.now() - start), ['reset']);

  const reportPath = getReportPath(width, height, framerate, seed);
  logFormatted('Writing report: ', ['bright', 'yellow'], reportPath, ['reset']);
  writeReport(reportPath, snapshots);

  console.log();
  console.log();
};

// Run one test if provided command line args, otherwise run a variety

if (process.argv[2] !== undefined) {
  const [
    hours,
    width = 1000,
    height = 1000,
    framerate = 60,
  ] = process.argv.slice(2).map(Number);
  run(hours * HR, width, height, framerate);
} else {
  run(1 * HR, 1000, 1000, 15);
  run(30 * MIN, 1000, 1000, 144);
  run(1 * HR, 600, 800, 60);
  run(30 * MIN, 1920, 1080, 60);
  run(8 * HR, 1000, 1000, 60);
}
