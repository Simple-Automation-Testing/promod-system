import { waitForCondition } from 'sat-utils';
import { IWaitConditionOpts } from './interfaces';
import { getConfiguration } from '../config';

const { browserAction } = getConfiguration();

async function waitForTabTitleEqual(browser, title: string, opts: IWaitConditionOpts = {}) {
  const { message, ...rest } = opts;

  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentTitle = await browser[browserAction.getTitle]();

      createErrorMessage = () => `Current browser window title ${currentTitle} should equal ${title}`;

      return currentTitle === title;
    },
    { createMessage: message ? () => message : createErrorMessage, ...rest },
  );
}

async function waitForTabTitleIncludes(browser, title: string, opts: IWaitConditionOpts = {}) {
  const { message, ...rest } = opts;

  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentTitle = await browser[browserAction.getTitle]();

      createErrorMessage = () => `Current browser window title ${currentTitle} should include ${title}`;

      return currentTitle.includes(title);
    },
    { createMessage: message ? () => message : createErrorMessage, ...rest },
  );
}

async function waitForUrlIncludes(browser, url: string, opts: IWaitConditionOpts = {}) {
  const { message, ...rest } = opts;

  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentUrl = await browser[browserAction.getCurrentUrl]();

      createErrorMessage = () => `Current url ${currentUrl} should include ${url}`;

      return currentUrl.includes(url);
    },
    { createMessage: message ? () => message : createErrorMessage, ...rest },
  );
}

async function waitForUrlNotIncludes(browser, url: string, opts: IWaitConditionOpts = {}) {
  const { message, ...rest } = opts;

  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentUrl = await browser[browserAction.getCurrentUrl]();

      createErrorMessage = () => `Current url ${currentUrl} should not include ${url}`;

      return !currentUrl.includes(url);
    },
    { createMessage: message ? () => message : createErrorMessage, ...rest },
  );
}

async function waitForUrlEquals(browser, url: string, opts: IWaitConditionOpts = {}) {
  const { message, ...rest } = opts;

  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentUrl = await browser[browserAction.getCurrentUrl]();

      createErrorMessage = () => `Current url ${currentUrl} should equal ${url}`;

      return currentUrl === url;
    },
    { createMessage: message ? () => message : createErrorMessage, ...rest },
  );
}

async function waitForUrlNotEquals(browser, url: string, opts: IWaitConditionOpts = {}) {
  const { message, ...rest } = opts;

  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentUrl = await browser[browserAction.getCurrentUrl]();

      createErrorMessage = () => `Current url ${currentUrl} should not equal ${url}`;

      return currentUrl !== url;
    },
    { createMessage: message ? () => message : createErrorMessage, ...rest },
  );
}

async function waitForTabsQuantity(browser, quantity: number, opts: IWaitConditionOpts = {}) {
  const { message, ...rest } = opts;

  let createErrorMessage;

  return waitForCondition(
    async () => {
      const browserTabs = await browser[browserAction.getTabs]();

      createErrorMessage = () =>
        `Current browser tabs quantity is ${browserTabs.length} expected quantity is ${quantity}`;

      return browserTabs.length === quantity;
    },
    { createMessage: message ? () => message : createErrorMessage, ...rest },
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
