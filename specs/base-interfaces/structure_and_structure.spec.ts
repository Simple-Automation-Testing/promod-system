import { expect } from 'assertior';
import { updateElementActionsMap } from '../../system/base-interfaces/element';
import { updateCollectionDescription, updateSystemPropsList } from '../../system/base-interfaces/structure';
import { seleniumWD } from 'promod';

import { ElementTest } from './_misc.element';
import { StructureAsFragment, StructureAsPage } from './_misc.structure';
import { actionFile } from './_misc';

const { browser, getSeleniumDriver } = seleniumWD;

class TestUserFormFragment extends StructureAsFragment {
  private username: ElementTest;
  private password: ElementTest;
  private submit: ElementTest;

  constructor(locator, structureName, rootElement) {
    super(locator, structureName, rootElement);

    this.username = this.init('#username', 'Username', ElementTest);
    this.password = this.init('#password', 'Password', ElementTest);
    this.submit = this.init('#user_submit', 'Submit', ElementTest);
  }
}

class TestPage extends StructureAsPage {
  private userform: TestUserFormFragment;
  private userdata: ElementTest;

  constructor() {
    super('body', 'Test Page');

    this.userform = this.init('#section1_internal3', 'User form', TestUserFormFragment);
    this.userdata = this.init('#userdata', 'User data', ElementTest);
  }
}

const elementActionMap = {
  click: 'click',
  hover: 'hover',
  focus: 'focus',
  scrollIntoView: 'scrollIntoView',
  isDisplayed: 'isDisplayed',
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
  describe('[P] actions', function () {
    updateElementActionsMap(elementActionMap);
    updateCollectionDescription(collectionDescriptionMap);
    updateSystemPropsList(systemPropsList);

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
  });
});
