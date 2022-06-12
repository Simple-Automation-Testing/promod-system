/* eslint-disable sonarjs/cognitive-complexity, sonarjs/prefer-immediate-return*/
import * as path from 'path';
import * as fs from 'fs';

const expectedConfigPath = path.resolve(process.cwd(), './promod.system.config.js');

function getConfiguration() {
  if (!fs.existsSync(expectedConfigPath)) {
    throw new Error(`${expectedConfigPath} does not exist`);
  }

  const config = require(expectedConfigPath);

  return config;
}

export { getConfiguration };
