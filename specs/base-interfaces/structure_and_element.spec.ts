import { expect } from 'assertior';
import { updateElementActionsMap } from '../../system/base-interfaces/element';
import { updateCollectionDescription } from '../../system/base-interfaces/structure';
import { seleniumWD } from 'promod';
import * as path from 'path';

import { ElementTest } from './_misc.element';
import { StructureTest } from './_misc.structure';

const { $, browser, getSeleniumDriver } = seleniumWD;

describe('PromodSystemStructure', function () {
  describe('[P] Actions with element', function () {
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

    updateElementActionsMap(elementActionMap);
    updateCollectionDescription(collectionDescriptionMap);

    const actionFile = `file://${path.resolve(__dirname, '../_misc/action.html')}`;

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
  });
});
