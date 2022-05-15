import * as fs from 'fs';
import * as path from 'path';

const template = `
const collectionDescription = {
  action: '_action',
  where: '_where',
  visible: '_visible',
  index: 'index',
	length: 'length',
};

const prettyMethodName = {
  isDisplayed: 'IsDisplayed',
  get: 'GetData',
  sendKeys: 'sendKeys',
  click: 'Click',
	waitForVisibilityState: 'WaitForVisibilityState',
	waitForContentState: 'WaitForContentState'
};

const baseResultData = ['attribute', 'color', 'backgroundColor', 'tagName', 'text', 'isSelected'];

module.exports = {
	collectionDescription,
	baseResultData,
	prettyMethodName,
};
`;

function createTemplateConfig() {
  fs.writeFileSync(path.resolve(process.cwd(), './promod.generator.config.js'), template);
}

export { createTemplateConfig };
