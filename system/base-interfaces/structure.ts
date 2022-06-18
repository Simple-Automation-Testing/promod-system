/* eslint-disable unicorn/prefer-switch */
import {
  isObject,
  isNull,
  compareToPattern,
  waitForCondition,
  safeHasOwnPropery,
  isFunction,
  isAsyncFunction,
  isEmptyObject,
  safeJSONstringify,
} from 'sat-utils';
import { PromodSystemCollection } from './collection';
import { getConfiguration } from '../config/config';
import { promodLogger } from '../logger';

const structure = {
  log(...data) {
    promodLogger.promodSystem('[PROMOD SYSTEM STRUCTURE]', ...data);
  },
};

const { systemPropsList = [], collectionDescription = {}, baseLibraryDescription = {} } = getConfiguration();

class PromodSystemStructure {
  public rootLocator: any;
  public identifier: any;
  public rootElement: any;
  public parent: any;
  public index: any;
  public name: any;

  private logger: { log(...args: any[]): void };

  constructor(locator, structureName, rootElement) {
    this.rootLocator = locator;
    this.identifier = structureName;
    this.rootElement = rootElement;
    this.parent = null;
    this.index = 0;

    this.logger = structure;
  }

  set structureLogger(logger: { log: (...args) => void }) {
    this.logger = logger;
  }

  set setParent(parent) {
    this.parent = parent;
  }

  set setIndex(index) {
    this.index = index;
  }

  /**
   * @override
   */
  overrideBaseMethods(...methods) {}

  /**
   * @override
   */
  init(...methods) {}

  /**
   * @override
   */
  async updateRoot() {}

  /**
   * @override
   */
  async waitLoadedState() {}

  async sendKeys(action): Promise<void> {
    this.logger.log('PromodSystemStructure sendKeys action call with data ', action);
    await this.waitLoadedState();
    for (const [key, value] of Object.entries(action)) {
      if (!this[key]) {
        throw new TypeError(`${key} is not found in ${this.identifier}`);
      }
      await this[key].sendKeys(value);
    }
  }

  async get(action): Promise<any> {
    this.logger.log('PromodSystemStructure get action call with data ', action);
    const alignedAction = this.alignActionData(action);

    await this.waitLoadedState();

    const values = {};

    for (const [key, value] of Object.entries(alignedAction)) {
      values[key] = await this[key].get(value);
    }
    return values;
  }

  async isDisplayed(action): Promise<any> {
    this.logger.log('PromodSystemStructure isDisplayed action call with data ', action);
    const alignedAction = this.alignActionData(action);

    const values = {};

    for (const [key, value] of Object.entries(alignedAction)) {
      values[key] = await this[key].isDisplayed(value);
    }

    return values;
  }

  async action(action): Promise<void> {
    this.logger.log('PromodSystemStructure action action call with data ', action);
    await this.waitLoadedState();

    const alignedAction = this.alignActionData(action);

    for (const [key, value] of Object.entries(alignedAction)) {
      await this[key].action(value);
    }
  }

  async compareContent(action): Promise<boolean> {
    this.logger.log('PromodSystemElement compareContent action call', action);
    for (const [key, value] of Object.entries(action)) {
      if (!(await this[key].compareContent(value))) {
        return false;
      }
    }
    return true;
  }

  async compareVisibility(action): Promise<boolean> {
    this.logger.log('PromodSystemElement compareVisibility action call', action);
    for (const [key, value] of Object.entries(action)) {
      if (!(await this[key].compareVisibility(value))) {
        return false;
      }
    }
    return true;
  }

  async waitVisibility(data, options?) {
    return this.executeWaitingState(data, options, 'isDisplayed');
  }

  async waitContent(data, options?) {
    return this.executeWaitingState(data, options, 'get');
  }

  private async executeWaitingState(expectedData, options, method: 'get' | 'isDisplayed') {
    const collectionActionProps = Object.values(collectionDescription).filter(key => key !== 'length');

    const mergedOpts = {
      // this props from compareToPattern sat-utils lib
      strictArrays: true,
      strictStrings: true,
      isEql: true,
      timeout: 30_000,
      message: `Structure ${this.identifier} state was not met`,
      createMessage: (timeout, initialError) => {
        return `${mergedOpts.message}.
          Required structure ${this.identifier} state - ${safeJSONstringify(expectedData)}.
          ${actualDataError}.
          time: ${timeout},
          ${initialError ? `error ${initialError}` : ''}
          `;
      },
      ...options,
    };
    const getStateData = this.alignWaitConditionData(JSON.parse(JSON.stringify(expectedData)));

    this.logger.log('PromodSystemElement executeWaitingState action', method);
    this.logger.log('PromodSystemElement executeWaitingState action expected data', expectedData);
    this.logger.log('PromodSystemElement executeWaitingState action mergedOptions data', mergedOpts);

    let actualDataError: string;
    await waitForCondition(
      async () => {
        const structureStateActualData = await this[method](getStateData);

        const { result, message } = compareToPattern(structureStateActualData, expectedData, {
          strictArrays: mergedOpts.strictArrays,
          strictStrings: mergedOpts.strictStrings,
          ignoreProperties: collectionActionProps as string[],
        });

        actualDataError = message;

        if ((isFunction(mergedOpts.asyncFn) || isAsyncFunction(mergedOpts.asyncFn)) && result !== mergedOpts.isEql) {
          await mergedOpts.asyncFn();
        }

        return result === mergedOpts.isEql;
      },
      {
        timeout: mergedOpts.timeout,
        createMessage: mergedOpts.createMessage,
      },
    );
  }

  private getStructureActionFields() {
    const properties = Object.getOwnPropertyNames(this)
      .filter(
        propertyName =>
          !systemPropsList.includes(propertyName) &&
          !isFunction(this[propertyName]) &&
          !isAsyncFunction(this[propertyName]),
      )
      .reduce((propertyNames, value) => {
        if (!this[value]?.constructor.name.includes('Fragment')) {
          propertyNames[value] = null;
        }
        return propertyNames;
      }, {});

    if (isEmptyObject(properties)) {
      throw new Error(`${this.identifier}: This structure doesn't have action props`);
    }
    return properties;
  }

  private alignActionData(action) {
    return isNull(action) ? this.getStructureActionFields() : action;
  }

  private alignWaitConditionData(cloneData, component = this) {
    const collectionActionProps = new Set(Object.values(collectionDescription).filter(key => key !== 'length'));
    const { length, ...rest } = cloneData;

    for (const key of Object.keys(rest)) {
      if (
        isObject(rest[key]) &&
        !collectionActionProps.has(key) &&
        component[key] instanceof PromodSystemCollection &&
        !safeHasOwnPropery(rest[key], '_action')
      ) {
        const itemsArrayChild = new component[key][baseLibraryDescription.collectionItemId](
          component[key].rootLocator,
          component[key].identifier,
          component[key].rootElements[baseLibraryDescription.getBaseElementFromCollectionByIndex](0),
        );
        const { _visible, index, _whereNot, _where, ...itemsArrRest } = rest[key];

        rest[key] = {
          _visible,
          index,
          _whereNot,
          _where,
          _action: this.alignWaitConditionData(itemsArrRest, itemsArrayChild),
        };
      } else if (isObject(rest[key]) && !collectionActionProps.has(key)) {
        rest[key] = this.alignWaitConditionData(rest[key], component[key]);
      } else if (collectionActionProps.has(key)) {
        rest[key] = { ...rest[key] };
      } else {
        rest[key] = null;
      }
    }

    return rest;
  }
}

function updateCollectionDescription(collectionDescriptionMap) {
  Object.assign(collectionDescription, collectionDescriptionMap);
}

function updateBaseLibraryDescription(baseLibraryDescriptionMap) {
  Object.assign(baseLibraryDescription, baseLibraryDescriptionMap);
}

export { PromodSystemStructure, updateCollectionDescription, updateBaseLibraryDescription };
