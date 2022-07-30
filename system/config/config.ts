/* eslint-disable sonarjs/cognitive-complexity, sonarjs/prefer-immediate-return*/
import * as path from 'path';
import * as fs from 'fs';

const expectedConfigPath = path.resolve(process.cwd(), './promod.system.config.js');

interface IConfig {
  read(ignoreExisting?: boolean): IConfig;
  get(): { [key: string]: any };
  updateConfigField(key: string, data: any): void;
}

const config: IConfig = (function getConfiguration() {
  const wrappedConfig = {};

  const configMethods = {
    /**
     * @param {boolean} ignoreExisting dont throw an error if config file does not exist
     * @returns {typeof configMethods}
     */
    read(ignoreExisting: boolean = true): typeof configMethods {
      const isFileExist = fs.existsSync(expectedConfigPath);

      if (!isFileExist && !ignoreExisting) {
        throw new Error(`${expectedConfigPath} does not exist`);
      } else if (isFileExist) {
        const conf = require(expectedConfigPath);
        // TODO validation
        Object.assign(wrappedConfig, conf);
      }

      return configMethods;
    },
    get() {
      return { ...wrappedConfig };
    },
    /**
     * @param {string} key key that should be updated
     * @param {any} data data that will be assigned on prop
     * @returns {void}
     */
    updateConfigField(key: string, data: any): void {
      // TODO does it required to be assign
      wrappedConfig[key] = data;
    },
  };

  return configMethods;
})().read();

export { config };
