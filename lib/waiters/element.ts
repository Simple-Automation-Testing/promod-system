import {IWaitConditionOpts} from './interfaces';

import {waitForCondition} from 'sat-utils';

let elementAction = {
	isEnabled: 'isEnabled',
	isDisplayed: 'isDisplayed',
	isPresent: 'isPresent',
	getText: 'getText',
}

async function waitForEnabled(element, isEnabled: boolean, opts: IWaitConditionOpts = {}) {
	const {message, ...rest} = opts;

	let createErrorMessage;

	return waitForCondition(async () => {
		const isElementItemEnabled = await element.isEnabled();

		createErrorMessage = () => `Expected element enabled state should be ${isEnabled} current state is ${isElementItemEnabled}`;

		return isEnabled === isElementItemEnabled;
	}, {
		createMessage: message ? () => message : createErrorMessage, ...rest,
	});
};

async function waitForDisplayed(element, isDisplayed: boolean, opts: IWaitConditionOpts = {}) {
	const {message, ...rest} = opts;

	let createErrorMessage;

	return waitForCondition(async () => {
		const isElementItemDisplayed = await element.isDisplayed();

		createErrorMessage = () => `Expected element displayed state should be ${isDisplayed} current state is ${isElementItemDisplayed}`;

		return isDisplayed === isElementItemDisplayed;
	}, {
		createMessage: message ? () => message : createErrorMessage, ...rest
	});
}

async function waitForPresented(element, isPresented: boolean, opts: IWaitConditionOpts = {}) {
	const {message, ...rest} = opts;

	let createErrorMessage;

	return waitForCondition(async () => {
		const isElementItemPresented = await element.isPresent();

		createErrorMessage = () => `Expected element presented state should be ${isPresented} current state is ${isElementItemPresented}`;

		return isPresented === isElementItemPresented;
	}, {
		createMessage: message ? () => message : createErrorMessage, ...rest,
	});
}

const elementWaiters = {
	addDecorator(decorate: (originalWaiter: (...args: any[]) => Promise<void>, ...args: any[]) => unknown) {
		// ignore *addDecorator* method
		const keys = Object.getOwnPropertyNames(this)
			.filter((key) => key !== 'addDecorator' && key !== 'updateElementActionsMap');
		keys.forEach((key) => {
			const initialMethodImplementation = this[key];
			this[key] = function(...args) {
				return decorate(initialMethodImplementation.bind(this, ...args), ...args);
			}
		})
	},
	updateElementActionsMap(elementActionMap: typeof elementAction) {
		elementAction = elementActionMap;
	},
	waitForDisplayed,
	waitForEnabled,
	waitForPresented,
}

function createBrowserWaiters() {
	return elementWaiters
}

export {
	elementWaiters,
};
