import { expect } from 'assertior';
import { seleniumWD } from 'promod';
import { TestPage, TestComplexPage } from '../setup/complex';
import { actionFile } from '../.misc/setup';

const { browser, getSeleniumDriver } = seleniumWD;

describe('PromodSystemStructure', function () {
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

      await complexPage.waitContent({ collection: { field1: { text: 'field1 item1' } } }, { isEql: false });
    });

    it('complex page waiters', async () => {
      const complexPage = new TestComplexPage();
      await complexPage.waitContent({ collection: { field1: { text: 'field1 item1' } } }, { everyArrayItem: false });
    });
  });
});
