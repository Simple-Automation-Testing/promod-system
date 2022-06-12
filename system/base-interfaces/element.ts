import { isString, isNumber, compareToPattern, getType, isNull } from 'sat-utils';
import { promodLogger } from '../logger';

import { getConfiguration } from '../config/config';

const { elementAction = {} } = getConfiguration();

const element = {
  log(...data) {
    promodLogger.promodSystem('[PROMOD SYSTEM ELEMENT]', ...data);
  },
};

class PromodSystemElement {
  public rootLocator: string;
  public identifier: string;
  public rootElement: any;
  public parent: any;
  public index: number;
  public name: string;

  private logger: { log(...args: any[]): void };

  constructor(locator, elementName, rootElement) {
    this.rootLocator = locator;
    this.identifier = elementName;
    this.rootElement = rootElement;
    this.parent = null;
    this.index = 0;

    this.logger = element;
  }

  set setParent(parent) {
    this.parent = parent;
  }

  set setIndex(index) {
    this.index = index;
  }

  set elementLogger(logger) {
    this.logger = logger;
  }

  /**
   * @override
   */
  overrideBaseMethods(...methods) {}

  /**
   * @override
   */
  async updateRoot() {}

  /**
   * @override
   */
  async waitLoadedState() {}

  /**
   * @override
   */
  async baseGetData(...args) {}

  /**
   * @override
   */
  async baseSendKeys(...args) {}

  async sendKeys(action): Promise<void> {
    this.logger.log('PromodSystemElement sendKeys action call with data ', action);
    if (!isString(action) && !isNumber(action)) {
      throw new TypeError(`${this.identifier}: sendKeys(): argument should be a string or number ${getType(action)}`);
    }

    await this.waitLoadedState();
    await this.baseSendKeys(action);
  }

  async action(action) {
    this.logger.log('PromodSystemElement action action call with data ', action);
    if (!isString(action) && !isNull(action)) {
      throw new TypeError(`${this.identifier}: action(): argument should be a string or null ${getType(action)}`);
    }
    if (isNull(action)) {
      action = 'click';
    }
    await this[action]();
  }

  private async click(): Promise<void> {
    this.logger.log('PromodSystemElement click action call');
    await this.waitLoadedState();

    await this.rootElement[elementAction.click]();
  }

  private async scroll(): Promise<void> {
    this.logger.log('PromodSystemElement scroll action call');
    await this.waitLoadedState();

    return this.rootElement[elementAction.scrollIntoView]();
  }

  private async hover(): Promise<void> {
    this.logger.log('PromodSystemElement hover action call');
    await this.waitLoadedState();

    await this.rootElement[elementAction.hover]();
  }

  async get(action): Promise<any | unknown> {
    this.logger.log('PromodSystemElement get action call with data ', action);
    await this.waitLoadedState();

    return this.baseGetData(action);
  }

  async isDisplayed(): Promise<boolean> {
    this.logger.log('PromodSystemElement isDisplayed action call');
    return this.rootElement[elementAction.isDisplayed]();
  }

  async compareContent(action: any): Promise<boolean> {
    this.logger.log('PromodSystemElement compareContent action call', action);
    const elementContent = await this.get({ ...action });

    const { result } = compareToPattern(action, elementContent);

    return result;
  }

  async compareVisibility(action: boolean): Promise<boolean> {
    this.logger.log('PromodSystemElement compareVisibility action call', action);
    const elementVisibility = await this.isDisplayed();
    return elementVisibility === action;
  }
}

export { PromodSystemElement };
