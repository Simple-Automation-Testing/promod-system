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
    promodLogger.promodSystem('[PROMOD SYSTEM STUCTURE]', ...data);
  },
};

class PromodSystemStructure {
  public rootLocator: any;
  public identifier: any;
  public rootElement: any;
  public parent: any;
  public index: any;
  public name: any;

  private logger: { log(...args: any[]): void };

  constructor(locator, fragmentName, rootElement) {
    this.rootLocator = locator;
    this.identifier = fragmentName;
    this.rootElement = rootElement;
    this.parent = null;
    this.index = 0;

    this.logger = structure;
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

  async sendKeys(action) {
    this.logger.log('PromodSystemStructure sendKeys action call with data ', action);
    await this.waitLoadedState();
    for (const [key, value] of Object.entries(action)) {
      if (!this[key]) {
        throw new TypeError(`${key} is not found in ${this.identifier}`);
      }
      await this[key].sendKeys(value);
    }
  }

  async get(action) {
    this.logger.log('PromodSystemStructure get action call with data ', action);
    const alignedAction = this.alignActionData(action);

    await this.waitLoadedState();

    const values = {};

    for (const [key, value] of Object.entries(alignedAction)) {
      values[key] = await this[key].get(value);
    }
    return values;
  }

  async isDisplayed(action) {
    this.logger.log('PromodSystemStructure isDisplayed action call with data ', action);
    const alignedAction = this.alignActionData(action);

    const values = {};

    for (const [key, value] of Object.entries(alignedAction)) {
      values[key] = await this[key].isDisplayed(value);
    }

    return values;
  }

  async action(action) {
    this.logger.log('PromodSystemStructure action action call with data ', action);
    await this.waitLoadedState();

    const alignedAction = this.alignActionData(action);

    for (const [key, value] of Object.entries(alignedAction)) {
      await this[key].action(value);
    }
  }

  async isSameContent(action) {
    this.logger.log('PromodSystemElement compareContent action call', action);
    for (const [key, value] of Object.entries(action)) {
      if (!(await this[key].isSameContent(value))) {
        return false;
      }
    }
    return true;
  }

  async isSameVisibility(action) {
    for (const [key, value] of Object.entries(action)) {
      if (!(await this[key].isSameVisibility(value))) {
        return false;
      }
    }
    return true;
  }

  async waitForVisibilityState(data, options) {
    return this.executeWaitingState(data, options, 'isDisplayed');
  }

  async waitForContentState(data, options) {
    return this.executeWaitingState(data, options, 'get');
  }

  private async executeWaitingState(expectedData, options, method: 'get' | 'isDisplayed') {
    const { collectionDescription = {} } = getConfiguration();

    const collectionActionProps = Object.values(collectionDescription).filter(key => {
      key !== 'length';
    });

    const mergedOpts = {
      // this props from compareToPattern sat-utils lib
      strictArrays: true,
      strictStrings: true,
      isEql: true,
      timeout: 30_000,
      message: `Structure ${this.identifier} state was not met`,
      ...options,
    };
    const getStateData = this.alignWaitConditionData(JSON.parse(JSON.stringify(expectedData)));

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
        createMessage: (timeout, initialError) =>
          ({
            message: `${mergedOpts.message}.
          Required structure ${this.identifier} state - ${safeJSONstringify(expectedData)}.
          ${actualDataError}.
          time: ${timeout},
          ${initialError ? `error ${initialError}` : ''}
        `,
          } as any),
      },
    );
  }

  private getStructureActionFields() {
    const { systemPropsList } = getConfiguration();
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
    const { collectionDescription = {} } = getConfiguration();

    const collectionActionProps = new Set(
      Object.values(collectionDescription).filter(key => {
        key !== 'length';
      }),
    );
    const { length, ...rest } = cloneData;

    for (const key of Object.keys(rest)) {
      if (
        isObject(rest[key]) &&
        !collectionActionProps.has(key) &&
        component[key] instanceof PromodSystemCollection &&
        !safeHasOwnPropery(rest[key], '_action')
      ) {
        const itemsArrayChild = new component[key].CollectionItemClass(
          component[key].rootLocator,
          component[key].identifier,
          component[key].rootElements.get(0),
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

export { PromodSystemStructure };
