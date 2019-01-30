import * as settings from '../settings.js';
import { range } from './arrays.js';

export const PI_2 = 2 * Math.PI;

// Cached lookup tables of expensive trig functions
const LUT_RES = 1024;
const LOOKUP_TABLES = {
  SIN: range(LUT_RES).map(i => Math.sin(PI_2 * i / LUT_RES)),
  COS: range(LUT_RES).map(i => Math.cos(PI_2 * i / LUT_RES)),
  ACOS: range(LUT_RES).map(i => Math.acos((i - (LUT_RES / 2)) / (LUT_RES / 2))),
};

export const sqr = n => n * n;

// Normalize an angle in turns to be between 0 and 1
// 0 turns = 0°, 0π, or no rotation; 1 turn = 360°, 2π, or one full rotation
export const roundAngle = (turns) => {
  if (turns >= 1) {
    return turns % 1;
  }
  if (turns < 0) {
    return turns + Math.ceil(Math.abs(turns));
  }
  return turns;
};

// Trig functions for angles in turns
const getTrigFn = (lut) => (turns) => lut[Math.floor(roundAngle(turns) * LUT_RES)];
export const sin = getTrigFn(LOOKUP_TABLES.SIN);
export const cos = getTrigFn(LOOKUP_TABLES.COS);
export const acos = getTrigFn(LOOKUP_TABLES.ACOS);

// Checks if a line is shorter than a distance (without sqrt)
export const isShorter = ({ x1, y1, x2, y2 }, distance) => (
  sqr(x1 - x2) + sqr(y1 - y2) < sqr(distance)
);

// Returns the size of the gap between two angles
export const getGap = (angle1, angle2) => {
  const gap = Math.abs(roundAngle(angle1) - roundAngle(angle2));
  return gap <= 0.5 ? gap : 1 - gap;
};

// A simple pseudo-random number generator which takes a base36 seed
// Based on this github gist by @blixit:
// gist.github.com/blixt/f17b47c62508be59987b
const getPrng = (alphaNumSeed) => {
  let seed = parseInt(alphaNumSeed, 36);
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483646;
  };
};

export const rand = getPrng(settings.seed);
export const randInt = (min, max) => min + Math.floor(rand() * (max - min));
