import { seleniumWD, PromodSeleniumElementType } from 'promod';
import { waitForCondition } from 'sat-utils';
import { PromodSystemElement } from '../../system/base-interfaces/element';

const { browser } = seleniumWD;

class ElementTest extends PromodSystemElement {
  constructor(locator, name, rootElement) {
    super(locator, name, rootElement);
  }

  async waitLoadedState() {
    await waitForCondition(async () => {
      return this.rootElement.isDisplayed();
    });
  }

  async baseSendKeys(value): Promise<void> {
    await this.rootElement.sendKeys(value);
  }

  async baseGetData(): Promise<{ background: any; value: any }> {
    return browser.executeScript(
      `
			const background = arguments[0].style.background;
			const value = arguments[0].value;
			const rect = arguments[0].getBoundingClientRect();
			const text = arguments[0].innerText.trim()
			return {background, value, rect, text}
			`,
      await this.rootElement.getWebDriverElement(),
    );
  }
}

export { ElementTest };
