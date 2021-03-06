import * as fs from 'fs';
import * as path from 'path';

const template = `
const collectionDescription = {
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
];

const prettyMethodName = {
  isDisplayed: 'IsDisplayed',
  get: 'GetData',
  sendKeys: 'sendKeys',
  click: 'Click',
	waitForVisibilityState: 'WaitForVisibilityState',
	waitForContentState: 'WaitForContentState'
};

const elementAction = {
  isEnabled: 'isEnabled',
  isDisplayed: 'isDisplayed',
  isPresent: 'isPresent',
  getText: 'getText',
  getAttribute: 'getAttribute',
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
  getBaseElementFromCollectionByIndex: 'get'
};

const baseResultData = ['attribute', 'color', 'backgroundColor', 'tagName', 'text', 'isSelected'];

module.exports = {
	collectionDescription,
	baseResultData,
	prettyMethodName,
  elementAction,
  baseLibraryDescription,
};
`;

function createTemplateConfig() {
  fs.writeFileSync(path.resolve(process.cwd(), './promod.system.config.js'), template);
}

export { createTemplateConfig };
