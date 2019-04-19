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
  separateBodies,
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

const logSnapshot = (snapshot) => {
  for (const [key, value] of Object.entries(snapshot)) {
    const roundedValue = Math.floor(value * 1000) / 1000;
    logFormatted(`${key}: `, [], roundedValue, ['dim']);
  }
};

const getReportPath = (...identifiers) => `headless-${identifiers.join('-')}.csv`;

const writeReport = (path, snapshots) => {
  const report = toCsv(snapshots);
  writeFileSync(resolve(REPORT_DIR, path), report);
};

const run = (width, height, framerate, duration) => {
  const start = Date.now();
  const frameDuration = 1 / framerate * SEC;

  const name = `${width}x${height} @ ${framerate} Hz`;
  logFormatted(`>>>>>> ${name} START <<<<<<`, ['bright', 'yellow']);

  global.innerWidth = width;
  global.innerHeight = height;
  restoreDefaultSettings();

  const { seed } = settings.core;
  seedPrng(seed);
  logFormatted('seed: ', [], seed, ['dim']);
  console.log();

  const snapshots = [];
  let bodies = range(settings.core.startingMeebaCount).map(getRandomBody);
  separateBodies(bodies);

  let time = 0;
  let nextSnapshot = 0;
  let nextLog = 0;

  while (time < duration) {
    bodies = simulateFrame(bodies, time, time + frameDuration);
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

// Run tests at a variety of screen sizes and framerates
run(1000, 1000, 15, 1 * HR);
run(1000, 1000, 144, 10 * MIN);
run(600, 800, 60, 2 * HR);
run(1920, 1080, 60, 30 * MIN);
run(1000, 1000, 60, 4 * HR);
