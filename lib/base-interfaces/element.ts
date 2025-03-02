import { isFunction, isString, isNumber, isObject, compareToPattern, getType, isNull } from 'sat-utils';
import { promodLogger } from '../logger';
import { config } from '../config';

import type { TelementActionsMap } from './types';

const {
  elementAction = {
    click: 'click',
    hover: 'hover',
    focus: 'focus',
    scrollIntoView: 'scrollIntoView',
    isDisplayed: 'isDisplayed',
    count: 'count',
    get: 'get',
  },
} = config.get();

const element = {
  log(...data) {
    promodLogger.promodSystem('[PROMOD SYSTEM ELEMENT]', ...data);
  },
};

/**
 * PromodSystemElement is used for defining base elements library, it has
 * required methods to interact with base page element, but some of them should be
 * overrided due to base library specific.
 *
 * PromodSystemElement expects that base library will have lazy element search.
 *
 * Designed for promod library but works with any other library or framework.
 *
 * @example
 * import type { PromodElementType } from 'promod/built/interface';
 * import { waitFor } from 'sat-wait';
 * import { PromodSystemElement } from 'promod-system';
 *
 * class Button extends PromodSystemElement<PromodElementType> {
 *   constructor(locator: string, elementName: string, root: PromodElementType) {
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
 *
 * @constructor
 * @param {string} locator element locator
 * @param {string} elementName element name
 * @param {any} rootElement root element object
 * @returns {PromodSystemElement}
 */
class PromodSystemElement<TrootElement = any> {
  protected rootLocator: string;
  protected identifier: string;
  protected rootElement: TrootElement;
  protected parent;
  protected index: number;
  protected name: string;
  protected successSearchParams;

  protected logger: { log(...args: any[]): void };

  /**
   * @param {{
   *  click: string;
   *  focus: string;
   *  scrollIntoView: string;
   *  hover: string;
   *  isDisplayed: string;
   * }} elementActionMap element action map that will be used to call required action
   *            based on library/framework
   */
  static updateElementActionsMap(elementActionMap: TelementActionsMap) {
    if (!isObject(elementActionMap)) {
      throw new TypeError('updateElementActionsMap(): expects that elementActionMap be an object');
    }
    Object.assign(elementAction, elementActionMap);
  }

  /**
   * @constructor
   * @param {string} locator element locator
   * @param {string} elementName element name
   * @param {any} rootElement root elemetn (depends on library/framework)
   *
   * @returns {PromodSystemElement}
   */
  constructor(locator: string, elementName: string, rootElement: any) {
    this.rootLocator = locator;
    this.identifier = elementName;
    this.rootElement = rootElement;
    this.parent = () => null;
    this.index = 0;

    this.logger = element;
  }

  set setParent(parent) {
    this.parent = parent;
  }

  set setIndex(index) {
    this.index = index;
  }

  set setSuccessSearchParams(searchParams) {
    this.successSearchParams = searchParams;
  }

  get getSuccessSearchParams() {
    return this.successSearchParams;
  }

  /**
   * @set logger
   */
  set elementLogger(logger: { log: (...args) => void }) {
    if (!isFunction(logger.log)) {
      throw new TypeError('elementLogger: logger should have a log method');
    }
    this.logger = logger;
  }

  /**
   * @override
   */
  async updateRoot() {}

  /**
   * @override
   */
  async waitLoadedState(methodSignature?: string, ignoreWaiting?: boolean) {}

  /**
   * @override
   */
  protected async baseGetData(...args): Promise<any> {}

  /**
   * @override
   */
  protected async baseSendKeys(...args): Promise<void> {}

  /**
   * @param {...(...args: []?): ? } methods methods that need to be overridden
   */
  overrideBaseMethods(...methods) {
    const methodsWhatCanBeOverridden = /^get|action|sendKeys|isDisplayed|compareContent|compareVisibility/;

    for (const method of methods) {
      const { name } = method;
      const [methodToOverride] = name.match(methodsWhatCanBeOverridden) || [];
      if (!methodToOverride) {
        throw new Error(`Element does not have method "${name}".
        PromodSystemElement available methods to override: get|action|sendKeys|isDisplayed|compareContent|compareVisibility`);
      }

      this[`${methodToOverride}Initial`] = this[methodToOverride];
      this[methodToOverride] = method.bind(this);
    }
  }

  /**
   * @param {string|number|?} action action data
   * @returns {Promise<void>}
   */
  async sendKeys(action: string | number | any): Promise<void> {
    this.logger.log('PromodSystemElement sendKeys action call with data ', action);
    if (!isString(action) && !isNumber(action)) {
      throw new TypeError(`${this.identifier}: sendKeys(): argument should be a string or number ${getType(action)}`);
    }

    await this.waitLoadedState();
    await this.baseSendKeys(action);
  }

  /**
   * @param {string|null} action action that will be called
   * @returns {Promise<void>}
   */
  async action(action: 'click' | 'hover' | 'focus' | 'scroll' | null): Promise<void> {
    this.logger.log('PromodSystemElement action action call with data ', action);
    if (isNull(action)) {
      action = 'click';
    }

    if (!isString(action)) {
      throw new TypeError(`${this.identifier}: action(): argument should be a string or null ${getType(action)}`);
    }

    if (!(action in this)) {
      throw new TypeError(
        `PromodSystemElement ${action} action does not exist, seems custom action was not implemented`,
      );
    }

    await this.waitLoadedState();

    await this[action]();
  }

  /**
   * @private
   */
  private async click(): Promise<void> {
    this.logger.log('PromodSystemElement click action call');

    await this.rootElement[elementAction.click]();
  }

  /**
   * @private
   */
  private async focus(): Promise<void> {
    this.logger.log('PromodSystemElement focus action call');

    await this.rootElement[elementAction.focus]();
  }

  /**
   * @private
   */
  private async scroll(): Promise<void> {
    this.logger.log('PromodSystemElement scroll action call');

    return this.rootElement[elementAction.scrollIntoView]();
  }

  /**
   * @private
   */
  private async hover(): Promise<void> {
    this.logger.log('PromodSystemElement hover action call');

    await this.rootElement[elementAction.hover]();
  }

  async get(action?, ignoreWaiting?: boolean): Promise<any> {
    this.logger.log('PromodSystemElement get action call with data ', action);

    await this.waitLoadedState(action, ignoreWaiting);

    return this.baseGetData(action);
  }

  async isDisplayed(): Promise<boolean> {
    this.logger.log('PromodSystemElement isDisplayed action call');
    return this.rootElement[elementAction.isDisplayed]();
  }

  async compareContent(action: any): Promise<boolean> {
    this.logger.log('PromodSystemElement compareContent action call', action);
    const elementContent = await this.get({ ...action });

    this.logger.log('PromodSystemElement compareContent element content', elementContent);

    const { result, message } = compareToPattern(elementContent, action);

    this.logger.log('PromodSystemElement compareContent action result', result);
    this.logger.log('PromodSystemElement compareContent action message', message);

    return result;
  }

  async compareVisibility(action: boolean): Promise<boolean> {
    this.logger.log('PromodSystemElement compareVisibility action call', action);
    const elementVisibility = await this.isDisplayed();

    this.logger.log('PromodSystemElement compareVisibility element visibility', elementVisibility);

    const { result, message } = compareToPattern(elementVisibility, action);

    this.logger.log('PromodSystemElement compareVisibility action result', result);
    this.logger.log('PromodSystemElement compareVisibility action message', message);

    return result;
  }
}

export { PromodSystemElement };
