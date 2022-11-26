# Base interfaces

## Structure

```ts
import { waitForCondition } from 'sat-utils';
import { seleniumWD } from 'promod';
import { PromodSystemStructure } from 'promod-system';

import type { PromodElementType } from 'promod/built/interface';

const { browser } = seleniumWD;

class BaseFragment extends PromodSystemStructure<PromodElementType> {
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
}
```
