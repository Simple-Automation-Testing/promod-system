/* eslint-disable unicorn/prefer-dom-node-text-content */
import { seleniumWD } from 'promod';
import { waitForCondition } from 'sat-utils';
import { PromodSystemElement } from '../../../system/base-interfaces/element';

import type { PromodElementType } from 'promod/built/interface';

const { browser } = seleniumWD;

class ElementTest extends PromodSystemElement<PromodElementType> {
  constructor(locator, name, rootElement: PromodElementType) {
    super(locator, name, rootElement);
  }

  async waitLoadedState() {
    await waitForCondition(async () => this.rootElement.isDisplayed());
  }

  async baseSendKeys(value): Promise<void> {
    await this.rootElement.sendKeys(value);
  }

  async baseGetData(): Promise<{ background: any; value: any }> {
    return browser.executeScript(element => {
      const background = element.style.background;
      const value = element.value;
      const rect = element.getBoundingClientRect();
      const text = element.innerText.trim();
      return { background, value, rect, text };
    }, await this.rootElement.getEngineElement());
  }
}

export { ElementTest };
