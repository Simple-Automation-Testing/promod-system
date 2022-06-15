import { waitForCondition } from 'sat-utils';
import { seleniumWD } from 'promod';
import { PromodSystemStructure } from '../../system/base-interfaces/structure';

class StructureTest extends PromodSystemStructure {
  constructor(locator, structureName, rootElement) {
    super(locator, structureName, rootElement);
  }

  init(fieldName: string, locator: string, name: string, Child: new (...args) => any, ...rest) {
    this[fieldName] = new Child(locator, name, this.rootElement.$(locator), ...rest);
  }

  async waitLoadedState() {
    await waitForCondition(async () => {
      return this.rootElement.isDisplayed();
    });
  }
}

export { StructureTest };
