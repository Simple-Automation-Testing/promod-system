import { waitForCondition, execNumberExpression } from 'sat-utils';

import { IWaitConditionOpts } from './interfaces';
import { config } from '../config';

const { elementAction } = config.get();

async function waitForAttributeIncludes(
  element,
  attribute: string,
  attributeValue: string,
  opts: IWaitConditionOpts = {},
) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const elementAttribute: string = await element[elementAction.getAttribute](attribute);

      createErrorMessage = () =>
        `Expected element "${attribute}" attribute which has ${elementAttribute} value should include "${attributeValue}"`;

      return elementAttribute.includes(attributeValue);
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

async function waitForAttributeEquals(
  element,
  attribute: string,
  attributeValue: string,
  opts: IWaitConditionOpts = {},
) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const elementAttribute: string = await element[elementAction.getAttribute](attribute);

      createErrorMessage = () =>
        `Expected element "${attribute}" attribute which has ${elementAttribute} value should equal "${attributeValue}"`;

      return elementAttribute === attributeValue;
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

async function waitForTextIncludes(element, text: string, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const elementText: string = await element[elementAction.getText]();

      createErrorMessage = () => `Expected element "${elementText}" text should include "${text}"`;

      return elementText.includes(text);
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

async function waitForText(element, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const elementText: string = await element[elementAction.getText]();

      createErrorMessage = () => `Expected element should have text content which is not empty`;

      return elementText.length;
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

async function waitForTextEquals(element, text: string, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const elementText: string = await element[elementAction.getText]();

      createErrorMessage = () => `Expected element "${elementText}" text should equal "${text}"`;

      return elementText.includes(text);
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

async function waitForDisplayed(element, isDisplayed: boolean, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const isElementItemDisplayed = await element[elementAction.isDisplayed]();

      createErrorMessage = () =>
        `Expected element displayed state should be ${isDisplayed} current state is ${isElementItemDisplayed}`;

      return isDisplayed === isElementItemDisplayed;
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

async function waitForPresented(element, isPresented: boolean, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const isElementItemPresented = await element[elementAction.isPresent]();

      createErrorMessage = () =>
        `Expected element presented state should be ${isPresented} current state is ${isElementItemPresented}`;

      return isPresented === isElementItemPresented;
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

async function waitForEnabled(element, isEnabled: boolean, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const isElementItemEnabled = await element[elementAction.isEnabled]();

      createErrorMessage = () =>
        `Expected element enabled state should be ${isEnabled} current state is ${isElementItemEnabled}`;

      return isEnabled === isElementItemEnabled;
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

async function waitForElementsCountEquals(elements, count: number, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentElementsCount = await elements[elementAction.count]();

      createErrorMessage = () => `Expected elements count should be ${count} current count is ${currentElementsCount}`;

      return currentElementsCount === count;
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

async function waitForElementsCountNotEquals(elements, count: number, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentElementsCount = await elements[elementAction.count]();

      createErrorMessage = () =>
        `Expected elements count should not be ${count} current count is ${currentElementsCount}`;

      return currentElementsCount !== count;
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

async function waitForElementsCountIsInRange(elements, range: string, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentElementsCount = await elements[elementAction.count]();

      createErrorMessage = () =>
        `Expected elements count should be in range ${range} current count is ${currentElementsCount}`;

      return execNumberExpression(range, currentElementsCount);
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

async function waitForEveryElementTextIncludes(elements, text: string, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentElementsCount = await elements[elementAction.count]();

      for (let i = 0; i < currentElementsCount; i++) {
        const elementText = (await elements[elementAction.get](i)[elementAction.getText]()) as string;
        if (!elementText.includes(text)) {
          createErrorMessage = () =>
            `Expected element with index ${i} should include text ${text}, current element text is ${elementText}`;
          return false;
        }
      }
      return true;
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

async function waitForEveryElementTextEquals(elements, text: string, opts: IWaitConditionOpts = {}) {
  let createErrorMessage;

  return waitForCondition(
    async () => {
      const currentElementsCount = await elements[elementAction.count]();

      for (let i = 0; i < currentElementsCount; i++) {
        const elementText = (await elements[elementAction.get](i)[elementAction.getText]()) as string;
        if (elementText !== text) {
          createErrorMessage = () =>
            `Expected element with index ${i} should equal text ${text}, current element text is ${elementText}`;
          return false;
        }
      }
      return true;
    },
    { ...opts, message: opts.message ? opts.message : createErrorMessage },
  );
}

const elementWaiters = {
  addDecorator(decorate: (originalWaiter: (...args: any[]) => Promise<void>, ...args: any[]) => unknown) {
    // ignore *addDecorator* *updateElementActionsMap* methods
    const keys = Object.getOwnPropertyNames(this).filter(
      key => key !== 'addDecorator' && key !== 'updateElementActionsMap',
    );
    keys.forEach(key => {
      const initialMethodImplementation = this[key];
      this[key] = function (...args) {
        return decorate(initialMethodImplementation.bind(this, ...args), ...args);
      };
    });
  },
  updateElementActionsMap(elementActionMap: typeof elementAction) {
    Object.assign(elementAction, elementActionMap);
  },
  waitForDisplayed,
  waitForEnabled,
  waitForPresented,
  waitForTextIncludes,
  waitForTextEquals,
  waitForAttributeIncludes,
  waitForAttributeEquals,
  waitForText,
  waitForElementsCountEquals,
  waitForElementsCountNotEquals,
  waitForElementsCountIsInRange,
  waitForEveryElementTextIncludes,
  waitForEveryElementTextEquals,
};

function createElementWaiters() {
  return elementWaiters;
}

export { createElementWaiters };
