import { isString, isNumber, compareToPattern, getType, isNull } from 'sat-utils';
import { promodLogger } from '../logger';

import { getConfiguration } from '../config/config';

const { elementAction = {} } = getConfiguration();

const element = {
  log(...data) {
    promodLogger.promodSystem('[PROMOD SYSTEM ELEMENT]', ...data);
  },
};

class PromodSystemElement<BaseLibraryElementType = any> {
  protected rootLocator: string;
  protected identifier: string;
  protected rootElement: BaseLibraryElementType;
  protected parent;
  protected index: number;
  protected name: string;

  protected logger: { log(...args: any[]): void };

  static updateElementActionsMap(elementActionMap) {
    Object.assign(elementAction, elementActionMap);
  }

  constructor(locator: string, elementName: string, rootElement: any) {
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

  set elementLogger(logger: { log: (...args) => void }) {
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
  protected async baseGetData(...args): Promise<any> {}

  /**
   * @override
   */
  protected async baseSendKeys(...args): Promise<void> {}

  async sendKeys(action): Promise<void> {
    this.logger.log('PromodSystemElement sendKeys action call with data ', action);
    if (!isString(action) && !isNumber(action)) {
      throw new TypeError(`${this.identifier}: sendKeys(): argument should be a string or number ${getType(action)}`);
    }

    await this.waitLoadedState();
    await this.baseSendKeys(action);
  }

  async action(action: 'click' | 'hover' | 'focus' | 'scroll' | null) {
    this.logger.log('PromodSystemElement action action call with data ', action);
    if (isNull(action)) {
      action = 'click';
    }

    if (!isString(action)) {
      throw new TypeError(`${this.identifier}: action(): argument should be a string or null ${getType(action)}`);
    }

    if (!(action in this)) {
      throw new TypeError(`
        PromodSystemElement ${action} action does not exist, seems custom action was not implemented
      `);
    }
    await this[action]();
  }

  private async click(): Promise<void> {
    this.logger.log('PromodSystemElement click action call');
    await this.waitLoadedState();

    await this.rootElement[elementAction.click]();
  }

  private async focus(): Promise<void> {
    this.logger.log('PromodSystemElement focus action call');
    await this.waitLoadedState();

    await this.rootElement[elementAction.focus]();
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

  async get(action?) {
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

    const { result, message } = compareToPattern(elementContent, action);

    this.logger.log('PromodSystemElement compareContent action result', result);
    this.logger.log('PromodSystemElement compareContent action message', message);

    return result;
  }

  async compareVisibility(action: boolean): Promise<boolean> {
    this.logger.log('PromodSystemElement compareVisibility action call', action);
    const elementVisibility = await this.isDisplayed();

    const { result, message } = compareToPattern(elementVisibility, action);

    this.logger.log('PromodSystemElement compareVisibility action result', result);
    this.logger.log('PromodSystemElement compareVisibility action message', message);

    return result;
  }
}

function updateElementActionsMap(elementActionMap) {
  Object.assign(elementAction, elementActionMap);
}

export { PromodSystemElement, updateElementActionsMap };
