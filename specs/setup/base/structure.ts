/* eslint-disable sonarjs/no-identical-functions */
import { waitForCondition } from 'sat-utils';
import { seleniumWD } from 'promod';
import { PromodSystemStructure } from '../../../system/base-interfaces/structure';
import { PromodSystemCollection } from '../../../system/base-interfaces/collection';

import type { PromodElementType, PromodElementsType } from 'promod/built/interface';

const { $ } = seleniumWD;

class StructureTest extends PromodSystemStructure<PromodElementType> {
  constructor(locator, structureName, rootElement) {
    super(locator, structureName, rootElement);
  }

  init(fieldName: string, locator: string, name: string, Child: new (...args) => any, ...rest) {
    this[fieldName] = new Child(locator, name, this.rootElement.$(locator), ...rest);
  }

  async waitLoadedState() {
    await waitForCondition(async () => this.rootElement.isDisplayed());
  }
}

class StructureAsPage extends PromodSystemStructure<PromodElementType> {
  constructor(locator, structureName) {
    super(locator, structureName, $(locator));
  }

  init(locator: string, name: string, Child: new (...args) => any) {
    return new Child(locator, name, this.rootElement.$(locator));
  }

  initCollection<TcollectionItem = any, TrootElements = PromodElementsType>(
    locator: string,
    name: string,
    Collection: typeof PromodSystemCollection,
    Child: TcollectionItem,
  ) {
    return new Collection<TrootElements, TcollectionItem>(locator, name, this.rootElement.$$(locator), Child);
  }

  async waitLoadedState() {
    await waitForCondition(async () => {
      return this.rootElement.isDisplayed();
    });
  }
}

class StructureAsFragment extends PromodSystemStructure<PromodElementType> {
  constructor(locator, structureName, rootElement) {
    super(locator, structureName, rootElement);
  }

  init(locator: string, name: string, Child: new (...args) => any, ...rest) {
    return new Child(locator, name, this.rootElement.$(locator), ...rest);
  }

  initCollection<TcollectionItem = any, TrootElements = PromodElementsType>(
    locator: string,
    name: string,
    Collection: typeof PromodSystemCollection,
    Child: TcollectionItem,
  ) {
    return new Collection<TrootElements, TcollectionItem>(locator, name, this.rootElement.$$(locator), Child);
  }

  async waitLoadedState() {
    await waitForCondition(async () => {
      return this.rootElement.isDisplayed();
    });
  }
}

export { StructureTest, StructureAsPage, StructureAsFragment };
