import { expect } from 'assertior';

import { ElementTest } from '../setup/base/element';
import { StructureTest } from '../setup/base/structure';
import { actionFile } from '../.misc/setup';

import { $, getDriver, browser } from '../setup/engine';

describe('PromodSystemStructure', function () {
  before(async () => {
    await getDriver(browser);
  });
  after(async () => {
    await browser.quitAll();
  });

  describe('[P] Actions with element', function () {
    beforeEach(async () => {
      await browser.get(actionFile);
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
          'scrollButton->text->Message: expected: data scroll string should include pattern scrollsss.',
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
