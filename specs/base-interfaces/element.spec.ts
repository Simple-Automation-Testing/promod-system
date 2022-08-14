import { expect } from 'assertior';
import { seleniumWD } from 'promod';

import { ElementTest } from '../setup/base/element';
import { actionFile } from '../.misc/setup';

const { $, browser, getSeleniumDriver } = seleniumWD;

describe('PromodSystemElement', function () {
  describe('[P] Actions', function () {
    before(async () => {
      await getSeleniumDriver(browser);
    });

    beforeEach(async () => {
      await browser.get(actionFile);
    });

    after(async () => {
      await browser.quitAll();
    });

    it('click default with null', async () => {
      const clickButton = $('#click');

      const clickElement = new ElementTest('#click', 'Click button', clickButton);
      await clickElement.action(null);

      const result = await clickElement.get();
      expect(result.background).toEqual('yellow');
    });

    it('click', async () => {
      const clickButton = $('#click');

      const clickElement = new ElementTest('#click', 'Click button', clickButton);
      await clickElement.action('click');

      const result = await clickElement.get();
      expect(result.background).toEqual('yellow');
    });

    it('hover', async () => {
      const hoverButton = $('#hover');

      const hoverElement = new ElementTest('#hover', 'Hover button', hoverButton);
      await hoverElement.action('hover');

      const result = await hoverElement.get();
      expect(result.background).toEqual('red');
    });

    it('focus', async () => {
      const focusButton = $('#focus');

      const focusElement = new ElementTest('#focus', 'Focus button', focusButton);
      await focusElement.action('focus');

      const result = await focusElement.get();
      expect(result.background).toEqual('pink');
    });

    it('sendKeys', async () => {
      const sendKeysInput = $('#sendKeys');

      const sendKeysElement = new ElementTest('#sendKeys', 'Send Keys input', sendKeysInput);
      await sendKeysElement.sendKeys('send keys');

      const result = await sendKeysElement.get();
      expect(result.value).toEqual('send keys');
    });

    it('scroll', async () => {
      const scrollButton = $('#scroll');

      const scrollElement = new ElementTest('#scroll', 'Scroll button', scrollButton);
      const rectBeforeScroll = await scrollElement.get();
      await scrollElement.action('scroll');
      const rectAfterScroll = await scrollElement.get();

      expect(rectBeforeScroll.rect.bottom).toNotEqual(rectAfterScroll.rect.bottom);
    });

    it('isDisplayed', async () => {
      const clickButton = $('#click');
      const clickElement = new ElementTest('#click', 'Click button', clickButton);

      const notExist = $('#not_exist_item');
      const notExistElement = new ElementTest('#not_exist_item', 'Not exist', notExist);

      expect(await clickElement.isDisplayed()).toEqual(true);
      expect(await notExistElement.isDisplayed()).toEqual(false);
    });
  });

  describe('[N] Fails', function () {
    it('[N] waitLoadedState', async () => {
      const notExist = $('#not_exist_item');
      const notExistElement = new ElementTest('#not_exist_item', 'Not exist', notExist);

      try {
        await notExistElement.get();
      } catch (error) {
        expect(error.toString()).toIncludeSubstring('Error: Required condition was not achieved');
      }
    });

    it('[N] action does not exist', async () => {
      const notExist = $('#not_exist_item');
      const notExistElement = new ElementTest('#not_exist_item', 'Not exist', notExist);

      try {
        // @ts-ignore
        await notExistElement.action('custom');
      } catch (error) {
        expect(error.toString()).toIncludeSubstring('PromodSystemElement custom action does not exist');
      }
    });
  });
});
