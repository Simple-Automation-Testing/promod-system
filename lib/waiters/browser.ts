import { waitForCondition, isObject, toArray, compareToPattern } from 'sat-utils';
import { config } from '../config';

import type { IWaitConditionOpts } from './interfaces';

const {
  browserAction = {
    getCurrentUrl: 'getCurrentUrl',
    getTabs: 'getTabs',
    getTitle: 'getTitle',
    getCookies: 'getCookies',
  },
} = config.get();

/**
 * @param {object} browser browser interaction interface
 * @param {cookieObj} cookieObj expected cookieObj
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForCookies(
  browser,
  cookieObj: { [k: string]: string } | { [k: string]: string }[],
  opts: IWaitConditionOpts = {},
) {
  if (!isObject(opts)) {
    throw new Error('waitForTabTitleEqual(): third argument "opts" should be an object');
  }

  const expectedCookies = toArray(cookieObj);
  opts.message = opts.message || (() => `Current browser page does not have required cookies`);

  return waitForCondition(async () => {
    const browserPageCookies = await browser[browserAction.getCookies]();

    return expectedCookies.every(cookie =>
      browserPageCookies.some(browserCookie => compareToPattern(browserCookie, cookie).result),
    );
  }, opts);
}

/**
 * @param {object} browser browser interaction interface
 * @param {cookieObj} cookieObj expected cookieObj
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForCookiesDoNoExist(
  browser,
  cookieObj: { [k: string]: string } | { [k: string]: string }[],
  opts: IWaitConditionOpts = {},
) {
  if (!isObject(opts)) {
    throw new Error('waitForTabTitleEqual(): third argument "opts" should be an object');
  }

  const expectedCookies = toArray(cookieObj);
  opts.message = opts.message || (() => `Current browser page does not have required cookies`);

  return waitForCondition(async () => {
    const browserPageCookies = await browser[browserAction.getCookies]();

    return expectedCookies.every(
      cookie => !browserPageCookies.some(browserCookie => compareToPattern(browserCookie, cookie).result),
    );
  }, opts);
}

/**
 * @param {object} browser browser interaction interface
 * @param {string} title expected page title
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForTabTitleEqual(browser, title: string, opts: IWaitConditionOpts = {}) {
  if (!isObject(opts)) {
    throw new Error('waitForTabTitleEqual(): third argument "opts" should be an object');
  }

  let browserPageTitle;
  const getBrowserPageTitle = () => browserPageTitle;

  opts.message = opts.message || (() => `Current browser window title ${getBrowserPageTitle()} should equal ${title}`);

  return waitForCondition(async () => {
    browserPageTitle = await browser[browserAction.getTitle]();

    return browserPageTitle === title;
  }, opts);
}

/**
 * @param {object} browser browser interaction interface
 * @param {string} title expected page title part
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForTabTitleIncludes(browser, title: string, opts: IWaitConditionOpts = {}) {
  if (!isObject(opts)) {
    throw new Error('waitForTabTitleIncludes(): third argument "opts" should be an object');
  }

  let browserPageTitle;
  const getBrowserPageTitle = () => browserPageTitle;

  opts.message =
    opts.message || (() => `Current browser window title ${getBrowserPageTitle()} should include ${title}`);

  return waitForCondition(async () => {
    browserPageTitle = await browser[browserAction.getTitle]();

    return browserPageTitle.includes(title);
  }, opts);
}

/**
 * @param {object} browser browser interaction interface
 * @param {string} url expected page url part
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForUrlIncludes(browser, url: string, opts: IWaitConditionOpts = {}) {
  if (!isObject(opts)) {
    throw new Error('waitForUrlIncludes(): third argument "opts" should be an object');
  }

  let browserPageUrl;
  const getBrowserPageUrl = () => browserPageUrl;

  opts.message = opts.message || (() => `Current browser window url ${getBrowserPageUrl()} should include ${url}`);

  return waitForCondition(async () => {
    browserPageUrl = await browser[browserAction.getCurrentUrl]();

    return browserPageUrl.includes(url);
  }, opts);
}

/**
 * @param {object} browser browser interaction interface
 * @param {string} url page url part
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForUrlNotIncludes(browser, url: string, opts: IWaitConditionOpts = {}) {
  if (!isObject(opts)) {
    throw new Error('waitForUrlNotIncludes(): third argument "opts" should be an object');
  }

  let browserPageUrl;
  const getBrowserPageUrl = () => browserPageUrl;

  opts.message = opts.message || (() => `Current browser window url ${getBrowserPageUrl()} should not include ${url}`);

  return waitForCondition(async () => {
    browserPageUrl = await browser[browserAction.getCurrentUrl]();

    return !browserPageUrl.includes(url);
  }, opts);
}

/**
 * @param {object} browser browser interaction interface
 * @param {string} url page url
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForUrlEquals(browser, url: string, opts: IWaitConditionOpts = {}) {
  if (!isObject(opts)) {
    throw new Error('waitForUrlEquals(): third argument "opts" should be an object');
  }

  let browserPageUrl;
  const getBrowserPageUrl = () => browserPageUrl;

  opts.message = opts.message || (() => `Current browser window url ${getBrowserPageUrl()} should equal to ${url}`);

  return waitForCondition(async () => {
    browserPageUrl = await browser[browserAction.getCurrentUrl]();

    return browserPageUrl === url;
  }, opts);
}

/**
 * @param {object} browser browser interaction interface
 * @param {string} url page url
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForUrlNotEquals(browser, url: string, opts: IWaitConditionOpts = {}) {
  if (!isObject(opts)) {
    throw new Error('waitForUrlNotEquals(): third argument "opts" should be an object');
  }

  let browserPageUrl;
  const getBrowserPageUrl = () => browserPageUrl;

  opts.message = opts.message || (() => `Current browser window url ${getBrowserPageUrl()} should not equal ${url}`);

  return waitForCondition(async () => {
    browserPageUrl = await browser[browserAction.getCurrentUrl]();

    return browserPageUrl !== url;
  }, opts);
}

/**
 * @param {object} browser browser interaction interface
 * @param {string} quantity browser pages quantity
 * @param {IWaitConditionOpts} opts
 * @returns {Promise<boolean>}
 */
async function waitForTabsQuantity(browser, quantity: number, opts: IWaitConditionOpts = {}) {
  if (!isObject(opts)) {
    throw new Error('waitForTabsQuantity(): third argument "opts" should be an object');
  }

  let browserTabsQuantity;
  const getBrowserTabsQuantity = () => browserTabsQuantity;

  opts.message =
    opts.message || (() => `Current browser tabs quantity ${getBrowserTabsQuantity()} should equal ${quantity}`);

  return waitForCondition(async () => {
    // eslint-disable-next-line unicorn/no-await-expression-member
    browserTabsQuantity = (await browser[browserAction.getTabs]()).length;

    return browserTabsQuantity === quantity;
  }, opts);
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
  waitForCookies,
  waitForCookiesDoNoExist,
};

function createBrowserWaiters() {
  return browserWaiters;
}

export { createBrowserWaiters };
