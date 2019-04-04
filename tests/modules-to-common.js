'use strict';

// Down and dirty script for converting ES6 modules to CommonJS
const fs = require('fs');
const path = require('path');

const INPUT_DIR = './app';
const OUTPUT_DIR = './tests';

const listJSPaths = dir => fs
  .readdirSync(dir)
  .map(file => (
    fs.statSync(`${dir}/${file}`).isDirectory()
      ? listJSPaths(`${dir}/${file}`)
      : `${dir}/${file}`
  ))
  .reduce((flat, files) => flat.concat(files), [])
  .filter(file => path.extname(file) === '.js');

const toCommon = (es6) => {
  const body = es6
    .replace(/import (?:\* as )?/g, 'const ')
    .replace(/from (['"`].+)(\.js['"`])/g, '= require($1.common$2)')
    .replace(/export /g, '');

  const exportMatches = es6.match(/export const \w+/g);
  const exportNames = exportMatches
    ? exportMatches.map(name => name.slice(13))
    : [];

  return `/** GENERATED FILE: DO NOT EDIT **/
'use strict';
if (typeof window === 'undefined') {
  var window = global;
}

${body}

module.exports = {
  ${exportNames.join(',\n  ')}
};
`;
};

// Run
for (const file of listJSPaths(INPUT_DIR)) {
  const input = fs.readFileSync(file, 'utf-8');
  const outputPath = `${path.resolve(OUTPUT_DIR, file).slice(0, -3)}.common.js`;
  fs.writeFileSync(outputPath, toCommon(input));
}
