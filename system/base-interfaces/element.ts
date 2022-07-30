import { isString, isNumber, compareToPattern, getType, isNull } from 'sat-utils';
import { promodLogger } from '../logger';
import { config } from '../config';

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
 * import { PromodSeleniumElementType } from 'promod';
 * import { waitForCondition } from 'sat-utils';
 * import { PromodSystemElement } from 'promod-system';
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
 *
 * @constructor
 * @param {string} locator element locator
 * @param {string} elementName element name
 * @param {any} rootElement root element object
 * @returns {PromodSystemElement}
 */
class PromodSystemElement {
  protected rootLocator: string;
  protected identifier: string;
  protected rootElement: any;
  protected parent;
  protected index: number;
  protected name: string;

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
  static updateElementActionsMap(elementActionMap) {
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

  async sendKeys(action): Promise<void> {
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

  /**
   * @private
   */
  private async click(): Promise<void> {
    this.logger.log('PromodSystemElement click action call');
    await this.waitLoadedState();

    await this.rootElement[elementAction.click]();
  }

  /**
   * @private
   */
  private async focus(): Promise<void> {
    this.logger.log('PromodSystemElement focus action call');
    await this.waitLoadedState();

    await this.rootElement[elementAction.focus]();
  }

  /**
   * @private
   */
  private async scroll(): Promise<void> {
    this.logger.log('PromodSystemElement scroll action call');
    await this.waitLoadedState();

    return this.rootElement[elementAction.scrollIntoView]();
  }

  /**
   * @private
   */
  private async hover(): Promise<void> {
    this.logger.log('PromodSystemElement hover action call');
    await this.waitLoadedState();

    await this.rootElement[elementAction.hover]();
  }

  async get(action?): Promise<any> {
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

export { PromodSystemElement };
