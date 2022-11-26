# Base interfaces

## Element

```ts
import { waitForCondition } from 'sat-utils';
import { seleniumWD, PromodElementType } from 'promod';
import { PromodSystemElement } from 'promod-system';

const { browser } = seleniumWD;

class BaseElement extends PromodSystemElement<PromodElementType> {
  constructor(locator, name, rootElement) {
    super(locator, name, rootElement);
  }

	/**
   * @info - waitLoadedState - this method should be overrided (implemented), depends on your project needs
	 * this method will be executed before all interactions (`action`, `sendKeys`, `get`)
	 * will not be executed before `isDisplayed` since main idea of this method is to wait element is ready to be interacted
   */
  async waitLoadedState() {
    await waitForCondition(async () => this.rootElement.isDisplayed());
  }

  /**
   * @info - baseSendKeys - this method should be overrided (implemented), depends on your project needs
   */
  async baseSendKeys(value): Promise<void> {
    await this.rootElement.sendKeys(value);
  }

  /**
   * @info - baseGetData - this method should be overrided (implemented), depends on your project needs
   */
  async baseGetData(): Promise<{ background: any; value: any }> {
    return browser.executeScript((el) => {
      const background = el.style.background;
			const value = el.value;
			const rect = el.getBoundingClientRect();
			const text = el.innerText.trim()
			return {background, value, rect, text}
    }, await this.rootElement.getEngineElement());
  }
}
```
