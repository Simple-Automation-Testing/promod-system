import {seleniumWD} from 'promod';
import {waitForCondition} from 'sat-utils';
import {IWaitConditionOpts} from './interfaces';

const {browser} = seleniumWD;

async function waitForUrlIncludes(url: string, opts: IWaitConditionOpts = {}) {
	const {message, ...rest} = opts;

	let createErrorMessage;

	return waitForCondition(async () => {
		const currentUrl = await browser.getCurrentUrl();

		createErrorMessage = () => `Current url ${currentUrl} should include ${url}`;

		return currentUrl.includes(url)
	}, {createMessage: message ? () => message : createErrorMessage, ...rest});
}

async function waitForTabsQuantity(quantity: number, opts: IWaitConditionOpts = {}) {
	const {message, ...rest} = opts;

	let createErrorMessage;

	return waitForCondition(async () => {
		const browserTabs = await browser.getTabs();

		createErrorMessage = () => `Current browser tabs quantity is ${browserTabs.length} expected quantity is ${quantity}`;

		return browserTabs.length === quantity;
	}, {createMessage: message ? () => message : createErrorMessage, ...rest});
}

const browserWaiters = {
	addDecorator(decorate: (originalWaiter: (...args: any[]) => Promise<void>, ...args: any[]) => unknown) {
		// ignore *addDecorator* method
		const keys = Object.getOwnPropertyNames(this).filter((key) => key !== 'addDecorator');
		keys.forEach((key) => {
			const initialMethodImplementation = this[key];
			this[key] = function(...args) {
				return decorate(initialMethodImplementation.bind(this, ...args), ...args);
			}
		})
	},
	waitForUrlIncludes,
	waitForTabsQuantity,
}

export {
	browserWaiters,
};
