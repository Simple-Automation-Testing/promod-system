import { expect } from 'assertior';
import { PromodSystemCollection } from '../../lib/base-interfaces';
import { ElementTest } from '../setup/base/element';
import { actionFile } from '../.misc/setup';

import { $$, $, getDriver, browser } from '../setup/engine';

function getSimpleCollection() {
  const collectionItems = $$('#simple_collection > button');
  return new PromodSystemCollection('#simple_collection > button', 'Collection button', collectionItems, ElementTest);
}

function getCollectionWithInvisibility() {
  const collectionItems = $$('#collection_with_visibility > button');
  return new PromodSystemCollection(
    '#collection_with_visibility > button',
    'Collection button',
    collectionItems,
    ElementTest,
  );
}

function getCollectionWithElementsThatAreNotExist() {
  const collectionItems = $$('#collection_with_visibility > .not_exist_element');
  return new PromodSystemCollection(
    '#collection_with_visibility > button',
    'Collection button',
    collectionItems,
    ElementTest,
  );
}

describe('PromodSystemCollection', function () {
  before(async () => {
    await getDriver(browser);
  });
  after(async () => {
    await browser.quitAll();
  });

  describe('[P] Actions', function () {
    beforeEach(async () => {
      await browser.get(actionFile);
    });

    it('click as click', async () => {
      await browser.get(actionFile);
      const resulter = $('#resulter');
      const promodCollection = getSimpleCollection();
      await promodCollection.action({ _action: 'click' });
      expect(await resulter.getText()).toEqual('1');
    });

    it('click as null', async () => {
      await browser.get(actionFile);
      const resulter = $('#resulter');
      const promodCollection = getSimpleCollection();
      await promodCollection.action({ _action: null });
      expect(await resulter.getText()).toEqual('1');
    });

    it('full action null', async () => {
      await browser.get(actionFile);
      const resulter = $('#resulter');
      const promodCollection = getSimpleCollection();
      await promodCollection.action(null);
      expect(await resulter.getText()).toEqual('1');
    });

    it('hover', async () => {
      await browser.get(actionFile);
      const promodCollection = getSimpleCollection();
      await promodCollection.action({ _action: 'hover' });
    });

    it('focus', async () => {
      await browser.get(actionFile);
      const collectionItems = $$('#simple_collection > button');
      const promodCollection = new PromodSystemCollection(
        '#simple_collection > button',
        'Collection button',
        collectionItems,
        ElementTest,
      );
      await promodCollection.action({ _action: 'focus' });
    });

    it('scroll', async () => {
      await browser.get(actionFile);
      const promodCollection = getSimpleCollection();
      await promodCollection.action({ _action: 'scroll' });
    });

    it('get as null', async () => {
      await browser.get(actionFile);
      const promodCollection = getSimpleCollection();
      const result = await promodCollection.get(null);

      expect(result.map(item => item.text)).toDeepEqual(['1', '2', '3', '4', '5']);
    });

    it('get as action null', async () => {
      await browser.get(actionFile);
      const promodCollection = getSimpleCollection();
      const result = await promodCollection.get({ _action: null });

      expect(result.map(item => item.text)).toDeepEqual(['1', '2', '3', '4', '5']);
    });
  });

  describe('[P] collection properties', function () {
    before(async () => {
      await getDriver(browser);
    });

    beforeEach(async () => {
      await browser.get(actionFile);
    });

    after(async () => {
      await browser.quitAll();
    });

    it('[P] _visible, _action does not exist', async () => {
      const promodCollection = getCollectionWithInvisibility();
      const result = await promodCollection.get({ _visible: true });

      expect(result.map(i => i.text)).toDeepEqual(['1', '3', '5']);
    });

    it('[P] _visible, _action null', async () => {
      const promodCollection = getCollectionWithInvisibility();
      const result = await promodCollection.get({ _visible: true, _action: null });

      expect(result.map(i => i.text)).toDeepEqual(['1', '3', '5']);
    });

    it('[P] _visible + _where', async () => {
      const promodCollection = getCollectionWithInvisibility();
      const result = await promodCollection.get({ _visible: true, _where: { text: '5' } });

      expect(result.map(i => i.text)).toDeepEqual(['5']);
    });

    it('[P] _visible + _whereNot', async () => {
      const promodCollection = getCollectionWithInvisibility();
      const result = await promodCollection.get({ _visible: true, _whereNot: { text: '5' } });

      expect(result.map(i => i.text)).toDeepEqual(['1', '3']);
    });

    it('[P] _visible + _whereNot + _where', async () => {
      const promodCollection = getCollectionWithInvisibility();
      const result = await promodCollection.get({ _visible: true, _where: { text: '3' }, _whereNot: { text: '5' } });

      expect(result.map(i => i.text)).toDeepEqual(['3']);
    });

    it('[P] _visible + _count', async () => {
      const promodCollection = getCollectionWithInvisibility();
      const result = await promodCollection.get({ _visible: true, _count: 2 });

      expect(result.map(i => i.text)).toDeepEqual(['1']);
    });

    it('[P] _visible + _indexes', async () => {
      const promodCollection = getCollectionWithInvisibility();
      const result = await promodCollection.get({ _visible: true, _indexes: [0, 1, 2] });

      expect(result.map(i => i.text)).toDeepEqual(['1', '3']);
    });

    it('[P] elements that are not exist default view', async () => {
      const promodCollection = getCollectionWithElementsThatAreNotExist();
      const result = await promodCollection.isDisplayed(null);

      expect(result.length).toEqual(0);
    });
  });
});
