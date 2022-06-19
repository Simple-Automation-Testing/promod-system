import { expect } from 'assertior';
import * as collection from '../../system/base-interfaces/collection';
import { updateElementActionsMap } from '../../system/base-interfaces/element';
import {
  updateCollectionDescription,
  updateSystemPropsList,
  updateBaseLibraryDescription,
} from '../../system/base-interfaces/structure';
import { seleniumWD } from 'promod';
import { TestPage, TestComplexPage } from './_misc.complex';
import { actionFile } from './_misc';

const { browser, getSeleniumDriver } = seleniumWD;

const elementActionMap = {
  click: 'click',
  hover: 'hover',
  focus: 'focus',
  scrollIntoView: 'scrollIntoView',
  isDisplayed: 'isDisplayed',
  count: 'count',
  get: 'get',
};

const baseLibraryDescription = {
  entityId: 'identifier',
  rootLocatorId: 'rootLocator',
  pageId: 'Page',
  fragmentId: 'Fragment',
  collectionId: 'Collection',
  collectionItemId: 'CollectionItemClass',
  collectionRootElementsId: 'rootElements',
  waitOptionsId: 'IWaitOpts',
  collectionActionId: 'ICollectionAction',
  collectionCheckId: 'ICollectionCheck',
  getDataMethod: 'get',
  getVisibilityMethod: 'isDisplayed',
  getBaseElementFromCollectionByIndex: 'get',
};

const collectionDescriptionMap = {
  action: '_action',
  where: '_where',
  whereNot: '_whereNot',
  visible: '_visible',
  index: '_indexes',
  count: '_count',
  length: 'length',
};
const systemPropsList = [
  'index',
  'rootLocator',
  'rootElements',
  'identifier',
  'CollectionItemClass',
  'overrideElement',
  'parent',
  'loaderLocator',
  'rootElement',
  'logger',
];

describe('PromodSystemStructure', function () {
  updateElementActionsMap(elementActionMap);
  updateCollectionDescription(collectionDescriptionMap);
  updateBaseLibraryDescription(baseLibraryDescription);
  updateSystemPropsList(systemPropsList);
  collection.updateBaseLibraryDescription(baseLibraryDescription);

  describe('[P] actions', function () {
    before(async () => {
      await getSeleniumDriver(browser);
    });

    beforeEach(async () => {
      await browser.get(actionFile);
    });

    after(async () => {
      await browser.quitAll();
    });

    it('sendKeys/click(null)/get ', async () => {
      const asPage = new TestPage();

      await asPage.sendKeys({
        userform: {
          username: 'test username',
          password: 'test password',
        },
      });

      const { userform: notSubmited } = await asPage.get({ userform: null });

      expect(notSubmited.username.value).toEqual('test username');
      expect(notSubmited.password.value).toEqual('test password');

      await asPage.action({ userform: { submit: null } });

      const { userform: submited, userdata } = await asPage.get({ userform: null, userdata: null });

      expect(submited.username.value).toEqual('test username');
      expect(submited.password.value).toEqual('test password');
      expect(userdata.text).toEqual('test username test password');
    });

    it('complex page get', async () => {
      const complexPage = new TestComplexPage();

      const result1 = await complexPage.get({ collection: { _action: { field1: null } } });
      expect(result1.collection.length).toEqual(3);

      const result2 = await complexPage.get({
        collection: { _action: { field1: null }, _where: { field1: { text: 'field1 item1' } } },
      });
      expect(result2.collection.length).toEqual(1);

      const result3 = await complexPage.get({
        collection: { _action: { field1: null }, _visible: { field3: false } },
      });
      expect(result3.collection.length).toEqual(1);

      const result4 = await complexPage.get({
        collection: {
          _action: { field1: null },
          _visible: { field3: true },
          _whereNot: { field1: { text: 'field1 item1' } },
        },
      });
      expect(result4.collection.length).toEqual(1);

      await complexPage.waitContent({ collection: { field1: { text: 'field1 item1' } } });
    });

    it('complex page waiters', async () => {
      const complexPage = new TestComplexPage();
      await complexPage.waitContent({ collection: { field1: { text: 'field1 item1' } } }, { strictArrays: false });
    });
  });
});
