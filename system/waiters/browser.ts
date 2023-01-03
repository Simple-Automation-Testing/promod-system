import { waitForCondition } from 'sat-utils';
import { config } from '../config';

import type { IWaitConditionOpts } from './interfaces';

const {
  browserAction = {
    getCurrentUrl: 'getCurrentUrl',
    getTabs: 'getTabs',
    getTitle: 'getTitle',
  },
} = config.get();

/**
 * @param {object} browser browser interaction interface
 * @param {string} title expected page title
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForTabTitleEqual(browser, title: string, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentTitle = await browser[browserAction.getTitle]();

      createErrorMessage = () => `Current browser window title ${currentTitle} should equal ${title}`;

      return currentTitle === title;
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

/**
 * @param {object} browser browser interaction interface
 * @param {string} title expected page title part
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForTabTitleIncludes(browser, title: string, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentTitle = await browser[browserAction.getTitle]();

      createErrorMessage = () => `Current browser window title ${currentTitle} should include ${title}`;

      return currentTitle.includes(title);
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

/**
 * @param {object} browser browser interaction interface
 * @param {string} url expected page url part
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForUrlIncludes(browser, url: string, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentUrl = await browser[browserAction.getCurrentUrl]();

      createErrorMessage = () => `Current url ${currentUrl} should include ${url}`;

      return currentUrl.includes(url);
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

/**
 * @param {object} browser browser interaction interface
 * @param {string} url page url part
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForUrlNotIncludes(browser, url: string, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentUrl = await browser[browserAction.getCurrentUrl]();

      createErrorMessage = () => `Current url ${currentUrl} should not include ${url}`;

      return !currentUrl.includes(url);
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

/**
 * @param {object} browser browser interaction interface
 * @param {string} url page url
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForUrlEquals(browser, url: string, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentUrl = await browser[browserAction.getCurrentUrl]();

      createErrorMessage = () => `Current url ${currentUrl} should equal ${url}`;

      return currentUrl === url;
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

/**
 * @param {object} browser browser interaction interface
 * @param {string} url page url
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForUrlNotEquals(browser, url: string, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentUrl = await browser[browserAction.getCurrentUrl]();

      createErrorMessage = () => `Current url ${currentUrl} should not equal ${url}`;

      return currentUrl !== url;
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

/**
 * @param {object} browser browser interaction interface
 * @param {string} quantity browser pages quantity
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForTabsQuantity(browser, quantity: number, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const browserTabs = await browser[browserAction.getTabs]();

      createErrorMessage = () =>
        `Current browser tabs quantity is ${browserTabs.length} expected quantity is ${quantity}`;

      return browserTabs.length === quantity;
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

const browserWaiters = {
  addDecorator(decorate: (originalWaiter: (...args: any[]) => Promise<void>, ...args: any[]) => unknown) {
    // ignore *addDecorator* and *updateBrowserActionsMap* methods
    const keys = Object.getOwnPropertyNames(this).filter(
      key => key !== 'addDecorator' && key !== 'updateBrowserActionsMap',
    );
    keys.forEach(key => {
      const initialMethodImplementation = this[key];
      this[key] = function (...args) {
        return decorate(initialMethodImplementation.bind(this, ...args), ...args);
      };
    });
  },
  updateBrowserActionsMap(browserActionMap: typeof browserAction) {
    Object.assign(browserAction, browserActionMap);
  },
  waitForUrlIncludes,
  waitForTabsQuantity,
  waitForUrlEquals,
  waitForTabTitleEqual,
  waitForTabTitleIncludes,
  waitForUrlNotEquals,
  waitForUrlNotIncludes,
};

function createBrowserWaiters() {
  return browserWaiters;
}

export { createBrowserWaiters };
