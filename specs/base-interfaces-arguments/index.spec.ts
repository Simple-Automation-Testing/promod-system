import { getActionArgumentsMessagePart } from '../../system/base-interfaces-arguments';
import { config } from '../../system/config';

config.updateConfigField('collectionDescription', {
  action: '_action',
  where: '_where',
  whereNot: '_whereNot',
  visible: '_visible',
  index: '_indexes',
  count: '_count',
  length: 'length',
});
config.updateConfigField('elementAction', {
  click: 'click',
  hover: 'hover',
  focus: 'focus',
  scrollIntoView: 'scrollIntoView',
  isDisplayed: 'isDisplayed',
  count: 'count',
  get: 'get',
});
config.updateConfigField('baseLibraryDescription', {
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
  waitVisibilityState: 'waitForVisibilityState',
  getVisibilityMethod: 'isDisplayed',
  getBaseElementFromCollectionByIndex: 'get',
});
config.updateConfigField('prettyMethodName', {
  action: 'ExecuteAction',
});
config.updateConfigField('baseResultData', ['text', 'color']);

describe('getActionArgumentsMessagePart', function () {
  it('test', function () {
    const data = {
      items: {
        results: {
          list: {
            _action: { x: { name: 'click' } },
            _visibility: { role: false },
            _where: { name: { text: 'TEST' } },
            _whereNot: { index: { text: 'ZZZZ' } },
          },
        },
      },
    };
    const method = 'onSomePageExecuteActionOnFragmentAAA';
    // TODO add proper specs
    console.log(getActionArgumentsMessagePart(method, data));
  });
});
