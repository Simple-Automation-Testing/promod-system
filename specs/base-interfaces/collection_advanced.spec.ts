import { compareToPattern } from 'sat-utils';
import { expect } from 'assertior';
import { PromodSystemCollection } from '../../lib/base-interfaces';
import { ElementTest } from '../setup/base/element';
import { StructureAsFragment } from '../setup/base/structure';
import { collection } from '../.misc/setup';

import { $, getDriver, browser } from '../setup/engine';
const { toDataIncludes } = compareToPattern;

class LastLayerItem extends StructureAsFragment {
  title;
  remove;

  constructor(locator, name, root) {
    super(locator, name, root);

    this.title = this.init('span', 'Title', ElementTest);
    this.remove = this.init('button', 'Remove', ElementTest);
  }
}

class SecondLayerItem extends StructureAsFragment {
  title;
  remove;
  nestedItems;

  constructor(locator, name, root) {
    super(locator, name, root);

    this.title = this.init('span', 'Title', ElementTest);
    this.remove = this.init('button', 'Remove', ElementTest);

    this.nestedItems = this.initCollection('.internal_div', 'Nested items', PromodSystemCollection, LastLayerItem);
  }
}

class AppItem extends StructureAsFragment {
  nestedItems;

  constructor() {
    super('#app', 'Test', $('#app'));

    this.nestedItems = this.initCollection('.div', 'Nested top ', PromodSystemCollection, SecondLayerItem);
  }
}

describe('PromodSystemCollection Advanced', function () {
  const appItem = new AppItem();

  before(async () => {
    await getDriver(browser);
  });

  beforeEach(async () => {
    await browser.get(collection);
  });

  after(async () => {
    await browser.quitAll();
  });

  it('[P] multy check _visible + _where + _whereNot', async () => {
    const result = await appItem.get({
      nestedItems: {
        _where: { nestedItems: { _whereNot: { title: { text: toDataIncludes('Item Internal') } } } },
        _action: { nestedItems: { _action: { title: null } } },
      },
    });

    expect(result.nestedItems.length).toEqual(0, 'Should be empty');
  });

  it('[P] multy check _visible + _where + _where', async () => {
    const result = await appItem.get({
      nestedItems: {
        _where: { nestedItems: { _where: { title: { text: toDataIncludes('Item Internal') } } } },
        _action: { nestedItems: { _action: { title: null } } },
      },
    });

    expect(result.nestedItems.length).toBeGreaterThan(0, 'Should not be empty');
  });
});
