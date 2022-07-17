import { expect } from 'assertior';
import { seleniumWD } from 'promod';

import { ElementTest } from './_misc.element';
import { StructureTest } from './_misc.structure';
import { actionFile } from './_misc';

const { $, browser, getSeleniumDriver } = seleniumWD;

describe('PromodSystemStructure', function () {
  describe('[P] Actions with element', function () {
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
      const structure = new StructureTest('body', 'Test structure', $('body'));

      structure.init('clickButton', '#click', 'Click button', ElementTest);

      await structure.action({ clickButton: null });
      const result = await structure.get({ clickButton: null });
      expect(result.clickButton.background).toEqual('yellow');
    });

    it('click', async () => {
      const structure = new StructureTest('body', 'Test structure', $('body'));

      structure.init('clickButton', '#click', 'Click button', ElementTest);

      await structure.action({ clickButton: 'click' });
      const result = await structure.get({ clickButton: null });
      expect(result.clickButton.background).toEqual('yellow');
    });

    it('hover', async () => {
      const structure = new StructureTest('body', 'Test structure', $('body'));

      structure.init('hoverButton', '#hover', 'Hover button', ElementTest);

      await structure.action({ hoverButton: 'hover' });
      const result = await structure.get({ hoverButton: null });
      expect(result.hoverButton.background).toEqual('red');
    });

    it('focus', async () => {
      const structure = new StructureTest('body', 'Test structure', $('body'));

      structure.init('focusButton', '#focus', 'Focus button', ElementTest);

      await structure.action({ focusButton: 'focus' });
      const result = await structure.get({ focusButton: null });
      expect(result.focusButton.background).toEqual('pink');
    });

    it('focus and hover', async () => {
      const structure = new StructureTest('body', 'Test structure', $('body'));

      structure.init('focusButton', '#focus', 'Focus button', ElementTest);
      structure.init('hoverButton', '#hover', 'Hover button', ElementTest);

      await structure.action({
        focusButton: 'focus',
        hoverButton: 'hover',
      });
      const result = await structure.get({ focusButton: null, hoverButton: null });
      expect(result.focusButton.background).toEqual('pink');
      expect(result.hoverButton.background).toEqual('red');
    });

    it('scroll', async () => {
      const structure = new StructureTest('body', 'Test structure', $('body'));

      structure.init('scrollButton', '#scroll', 'Focus button', ElementTest);

      const resultBeforeScroll = await structure.get({ scrollButton: null });
      await structure.action({ scrollButton: 'scroll' });
      const resultAfterScroll = await structure.get({ scrollButton: null });

      expect(resultBeforeScroll.scrollButton.rect.bottom).toNotEqual(resultAfterScroll.scrollButton.rect.bottom);
    });

    it('[P] waitContent', async () => {
      const structure = new StructureTest('body', 'Test structure', $('body'));

      structure.init('scrollButton', '#scroll', 'Focus button', ElementTest);

      await structure.waitContent({ scrollButton: { text: 'scroll' } });
    });

    it('[N] waitContent', async () => {
      const structure = new StructureTest('body', 'Test structure', $('body'));

      structure.init('scrollButton', '#scroll', 'Focus button', ElementTest);

      try {
        await structure.waitContent({ scrollButton: { text: 'scrollsss' } }, { timeout: 2500 });
      } catch (error) {
        expect(error.toString()).stringIncludesSubstring(
          'scrollButton->text->Message: expected: scrollsss, actual: scroll.',
        );
      }
    });

    it('[P] waitVisibility', async () => {
      const structure = new StructureTest('body', 'Test structure', $('body'));

      structure.init('scrollButton', '#scroll', 'Focus button', ElementTest);

      await structure.waitVisibility({ scrollButton: true });
    });

    it('[N] waitVisibility', async () => {
      const structure = new StructureTest('body', 'Test structure', $('body'));

      structure.init('scrollButton', '#scroll', 'Focus button', ElementTest);

      try {
        await structure.waitVisibility({ scrollButton: false }, { timeout: 2500 });
      } catch (error) {
        expect(error.toString()).stringIncludesSubstring('scrollButton->Message: expected: false, actual: true.');
      }
    });
  });
});
