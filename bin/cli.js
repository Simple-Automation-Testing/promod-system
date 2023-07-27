#!/usr/bin/env node

/* eslint-disable */
process.title = 'promod-system';

const fs = require('fs');
const path = require('path');
const { getDirFilesList } = require('sat-utils');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv)).argv;

const { createPageStructure } = require('../built/generator/generate');
const { createTemplateConfig } = require('../built/config/config.template');
const { logEnvUsage } = require('../built/config/env');

if (argv.clihelp) {
  console.info(`
    Usage:
      --envhelp                     - env vars that system uses
      --clihelp                     - get usage description
      --generate-config             - generate base config
      --file="/path/to/page.ts"                       - generate actions for required page
      --folder="/path/to/pages" --pattern=".page.js"  - generate actions for all pages in folder
  `);
  process.exit(0);
}

if (argv.ts) {
  require('ts-node').register({
    compilerOptions: { module: 'commonjs' },
    disableWarnings: true,
    fast: true,
  });
}

if (argv.envhelp) {
  logEnvUsage();
}

if (argv['generate-config']) {
  createTemplateConfig();
} else if (argv.folder && argv.pattern) {
  const folderPath = path.isAbsolute(argv.folder) ? argv.folder : path.resolve(process.cwd(), argv.folder);

  if (fs.existsSync(folderPath)) {
    getDirFilesList(folderPath)
      .filter(file => (argv.ignorePattern ? !file.includes(argv.ignorePattern) : true))
      .filter(file => file.includes(argv.pattern))
      .forEach(createPageStructure);
  } else {
    throw new Error(`folder ${argv.folder} does not exist`);
  }
} else if (!argv.file) {
  throw new Error('"file" argument should exist');
} else if (!fs.existsSync(argv.file)) {
  throw new Error('"file" should exist, please check file path which you use');
} else {
  createPageStructure(argv.file);
}
