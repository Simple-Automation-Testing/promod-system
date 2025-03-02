/* eslint-disable sonarjs/no-identical-functions */
import { waitFor } from 'sat-wait';
import { PromodSystemStructure } from '../../../lib/base-interfaces/structure';
import { PromodSystemCollection } from '../../../lib/base-interfaces/collection';

import type { PromodElementType, PromodElementsType } from 'promod/built/interface';
import { $ } from '../engine';

class StructureTest extends PromodSystemStructure<PromodElementType> {
  constructor(locator, structureName, rootElement) {
    super(locator, structureName, rootElement);
  }

  init(fieldName: string, locator: string, name: string, Child: new (...args) => any, ...rest) {
    this[fieldName] = new Child(locator, name, this.rootElement.$(locator), ...rest);
  }

  async waitLoadedState() {
    await waitFor(async () => this.rootElement.isDisplayed());
  }
}

class StructureAsPage extends PromodSystemStructure<PromodElementType> {
  constructor(locator, structureName) {
    super(locator, structureName, $(locator));
  }

  init(locator: string, name: string, Child: new (...args) => any) {
    return new Child(locator, name, this.rootElement.$(locator));
  }

  initCollection<TcollectionItem>(
    locator: string,
    name: string,
    Collection: typeof PromodSystemCollection,
    Child: TcollectionItem,
  ) {
    return new Collection<PromodElementsType, TcollectionItem>(locator, name, this.rootElement.$$(locator), Child);
  }

  async waitLoadedState() {
    await waitFor(async () => {
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

  initCollection<TcollectionItem>(
    locator: string,
    name: string,
    Collection: typeof PromodSystemCollection,
    Child: TcollectionItem,
  ) {
    return new Collection<PromodElementsType, TcollectionItem>(locator, name, this.rootElement.$$(locator), Child);
  }

  async waitLoadedState() {
    await waitFor(async () => {
      return this.rootElement.isDisplayed();
    });
  }
}

export { StructureTest, StructureAsPage, StructureAsFragment };
