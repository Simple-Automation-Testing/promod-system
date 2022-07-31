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
import { promodLogger } from '../logger';
import { getCollectionElementInstance, getCollectionActionData } from './utils';

type IWaiterOpts = {
  timeout?: number;
  interval?: number;
  message?: string;
  analyseEResult?: (...args: any[]) => boolean | Promise<boolean>;
  waiterError?: new (...args: any[]) => any;
  callEveryCycle?: () => Promise<void> | any;
  dontThrow?: boolean;
  falseIfError?: boolean;
  stopIfNoError?: boolean;
  strictArrays?: boolean;
  strictStrings?: boolean;
  isEql?: boolean;
};

const structure = {
  log(...data) {
    promodLogger.promodSystem('[PROMOD SYSTEM STRUCTURE]', ...data);
  },
};

const systemPropsList = [
  'index',
  'rootLocator',
  'rootElements',
  'identifier',
  'CollectionItemClass',
  'overrideElement',
  'parent',
  'loaderLocator',
  'rootElement',
  'logger',
];
const collectionDescription = {
  action: '_action',
  where: '_where',
  whereNot: '_whereNot',
  visible: '_visible',
  index: '_indexes',
  count: '_count',
  length: 'length',
};
const baseLibraryDescription = {
  entityId: 'identifier',
  rootLocatorId: 'rootLocator',
  pageId: 'Page',
  fragmentId: 'Fragment',
  collectionId: 'Collection',
  collectionItemId: 'CollectionItemClass',
  collectionRootElementsId: 'rootElements',
  waitOptionsId: 'IWaitOpts',
  collectionActionId: 'ICollectionAction',
  collectionCheckId: 'ICollectionCheck',
  getDataMethod: 'get',
  getVisibilityMethod: 'isDisplayed',
  getBaseElementFromCollectionByIndex: 'get',
};

/**
 * PromodSystemStructure is used for defining framework (pages and fragments),it has
 * required methods to interact with all level abstrations
 *
 * PromodSystemElement expects that base library will have lazy element search.
 *
 * Designed for promod library but works with any other library or framework.
 *
 * @example
 * import { PromodSeleniumElementType } from 'promod';
 * import { waitForCondition } from 'sat-utils';
 * import { PromodSystemElement, PromodSystemStructure } from 'promod-system';
 *
 * class Button extends PromodSystemElement<PromodSeleniumElementType> {
 *   constructor(locator: string, elementName: string, root: PromodSeleniumElementType) {
 *     super(locator, elementName, root);
 *   }
 *
 *   protected async baseGetData(): Promise<string> {
 *     return await this.rootElement.getText();
 *   }
 *
 *   async waitLoadedState() {
 *      return await waitForCondition(
 *        () => this.rootElement.isDisplayed(),
 *        {timeout: 10_000, message: `${this.identifier} does not become visible during 10 seconds`}
 *      )
 *   }
 *
 *   protected async baseSendKeys() {
 *     throw new TypeError(`${this.identifier} is a Button, please check usage of this element, button should not be used for sendKeys purpose.`)
 *   }
 * }
 *
 * class BaseFragment extends PromodSystemStructure {
 *    constructor(locator, structureName, rootElement) {
 *      super(locator, structureName, rootElement);
 *    }
 *
 *    init(locator: string, name: string, Child: new (...args) => any, ...rest) {
 *         return new Child(locator, name, this.rootElement.$(locator), ...rest);
 *    }
 * }
 *
 * class ButtonsFragment extends BaseFragment {
 *    private button1: Button;
 *    private button2: Button;
 *
 *    constructor(locator, structureName, rootElement) {
 *      super(locator, structureName, rootElement);
 *
 *      this.button1 = this.init('#butto1', 'Button 1', Button);
 *      this.button2 = this.init('#butto2', 'Button 2', Button);
 *    }
 * }
 * @constructor
 * @param {string} locator element locator
 * @param {string} elementName element name
 * @param {any} rootElement root element object
 * @returns {PromodSystemElement}
 */
class PromodSystemStructure {
  protected rootLocator: any;
  protected identifier: any;
  protected rootElement: any;
  protected parent: any;
  protected index: any;
  protected name: any;

  protected logger: { log(...args: any[]): void };

  static updateCollectionDescription(collectionDescriptionMap) {
    Object.assign(collectionDescription, collectionDescriptionMap);
  }

  static updateBaseLibraryDescription(baseLibraryDescriptionMap) {
    Object.assign(baseLibraryDescription, baseLibraryDescriptionMap);
  }

  static updateSystemPropsList(systemPropsListArr) {
    Object.assign(systemPropsList, systemPropsListArr);
  }

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
  init(...args) {}

  /**
   * @override
   */
  async updateRoot() {}

  /**
   * @override
   * @info
   * this method should be overridden, it will be execute to wait visibility before next base methods
   * sendKeys, get, action
   * ! for isDisplayed method waitLoadedState will not be executed.
   */
  async waitLoadedState() {}

  overrideBaseMethods(...methods) {
    const methodsWhatCanBeOverridden = /^get|action|sendKeys|isDisplayed|compareContent|compareVisibility/;

    for (const method of methods) {
      const { name } = method;
      const [methodToOverride] = name.match(methodsWhatCanBeOverridden) || [];
      if (!methodToOverride) {
        throw new Error(`Element does not have method "${name}".
        Available methods to override: get|action|sendKeys|isDisplayed|compareContent|compareVisibility`);
      }

      this[`${methodToOverride}Initial`] = this[methodToOverride];
      this[methodToOverride] = method.bind(this);
    }
  }

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
      this.logger.log(`PromodSystemStructure get action execution cycle for ${key} with data `, action);
      if (!this[key]) {
        throw new TypeError(`${key} is not found in ${this.identifier}`);
      }
      values[key] = await this[key].get(value);
    }
    return values;
  }

  async isDisplayed(action): Promise<any> {
    this.logger.log('PromodSystemStructure isDisplayed action call with data ', action);
    const alignedAction = this.alignActionData(action);

    const values = {};

    for (const [key, value] of Object.entries(alignedAction)) {
      this.logger.log(`PromodSystemStructure isDisplayed action execution cycle for ${key} with data `, action);
      if (!this[key]) {
        throw new TypeError(`${key} is not found in ${this.identifier}`);
      }
      values[key] = await this[key].isDisplayed(value);
    }

    return values;
  }

  async action(action): Promise<void> {
    this.logger.log('PromodSystemStructure action action call with data ', action);
    await this.waitLoadedState();

    const alignedAction = this.alignActionData(action);

    for (const [key, value] of Object.entries(alignedAction)) {
      this.logger.log(`PromodSystemStructure action action execution cycle for ${key} with data `, action);
      if (!this[key]) {
        throw new TypeError(`${key} is not found in ${this.identifier}`);
      }
      await this[key].action(value);
    }
  }

  async compareContent(action): Promise<boolean> {
    this.logger.log('PromodSystemStructure compareContent action call', action);
    for (const [key, value] of Object.entries(action)) {
      this.logger.log(`PromodSystemStructure compareContent action execution cycle for ${key} with data `, action);
      if (!(await this[key].compareContent(value))) {
        return false;
      }
    }
    return true;
  }

  async compareVisibility(action): Promise<boolean> {
    this.logger.log('PromodSystemStructure compareVisibility action call', action);
    for (const [key, value] of Object.entries(action)) {
      this.logger.log(`PromodSystemStructure compareVisibility action execution cycle for ${key} with data `, action);
      if (!(await this[key].compareVisibility(value))) {
        return false;
      }
    }
    return true;
  }

  async waitVisibility(data, options?: IWaiterOpts) {
    return this.executeWaitingState(data, options, 'isDisplayed');
  }

  async waitContent(data, options?: IWaiterOpts) {
    return this.executeWaitingState(data, options, 'get');
  }

  /**
   * @private
   */
  private async executeWaitingState(expectedData, options, method: 'get' | 'isDisplayed') {
    const collectionActionProps = Object.values(collectionDescription).filter(key => key !== 'length');

    const mergedOpts = {
      // this props from compareToPattern sat-utils lib
      strictArrays: true,
      strictStrings: true,
      isEql: true,
      timeout: 5000,
      message: (timeout, initialError) => {
        return `Structure ${this.identifier} state was not met.
          Required structure ${this.identifier} state - ${safeJSONstringify(expectedData)}.
          ${actualDataError}.
          time: ${timeout},
          ${initialError ? `error ${initialError}` : ''}
          `;
      },
      ...options,
    };
    const getStateData = this.alignWaitConditionData(JSON.parse(JSON.stringify(expectedData)));

    this.logger.log('PromodSystemStructure executeWaitingState action', method);
    this.logger.log('PromodSystemStructure executeWaitingState action expected data', expectedData);
    this.logger.log('PromodSystemStructure executeWaitingState action mergedOptions data', mergedOpts);

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
      { timeout: mergedOpts.timeout, message: mergedOpts.message },
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
        if (!this[value]?.constructor.name.includes(baseLibraryDescription.fragmentId)) {
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
        !safeHasOwnPropery(rest[key], collectionDescription.action)
      ) {
        const itemsArrayChild = getCollectionElementInstance(component[key], baseLibraryDescription);
        const { _outOfDescription, ...data } = getCollectionActionData(rest[key], collectionDescription);

        rest[key] = {
          ...data,
          [collectionDescription.action]: this.alignWaitConditionData(_outOfDescription, itemsArrayChild),
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
