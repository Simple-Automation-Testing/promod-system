import {IWaitConditionOpts} from './interfaces';

import {waitForCondition} from 'sat-utils';

let elementAction = {
	isEnabled: 'isEnabled',
	isDisplayed: 'isDisplayed',
	isPresent: 'isPresent',
	getText: 'getText',
	getAttribute: 'getAttribute',
}

async function waitForAttributeIncludes(element, attribute: string, attributeValue: string, opts: IWaitConditionOpts = {}) {
	const {message, ...rest} = opts;

	let createErrorMessage;

	return waitForCondition(async () => {
		const elementAttribute: string = await element[elementAction.getAttribute](attribute);

		createErrorMessage = () => `Expected element "${attribute}" attribute which has ${elementAttribute} value should include "${attributeValue}"`;

		return elementAttribute.includes(attributeValue);
	}, {
		createMessage: message ? () => message : createErrorMessage, ...rest,
	});
};

async function waitForAttributeEquals(element, attribute: string, attributeValue: string, opts: IWaitConditionOpts = {}) {
	const {message, ...rest} = opts;

	let createErrorMessage;

	return waitForCondition(async () => {
		const elementAttribute: string = await element[elementAction.getAttribute](attribute);

		createErrorMessage = () => `Expected element "${attribute}" attribute which has ${elementAttribute} value should equal "${attributeValue}"`;

		return elementAttribute === attributeValue;
	}, {
		createMessage: message ? () => message : createErrorMessage, ...rest,
	});
};

async function waitForTextIncludes(element, text: string, opts: IWaitConditionOpts = {}) {
	const {message, ...rest} = opts;

	let createErrorMessage;

	return waitForCondition(async () => {
		const elementText: string = await element[elementAction.getText]();

		createErrorMessage = () => `Expected element "${elementText}" text should include "${text}"`;

		return elementText.includes(text);
	}, {
		createMessage: message ? () => message : createErrorMessage, ...rest,
	});
};

async function waitForTextEquals(element, text: string, opts: IWaitConditionOpts = {}) {
	const {message, ...rest} = opts;

	let createErrorMessage;

	return waitForCondition(async () => {
		const elementText: string = await element[elementAction.getText]();

		createErrorMessage = () => `Expected element "${elementText}" text should equal "${text}"`;

		return elementText.includes(text);
	}, {
		createMessage: message ? () => message : createErrorMessage, ...rest,
	});
};

async function waitForDisplayed(element, isDisplayed: boolean, opts: IWaitConditionOpts = {}) {
	const {message, ...rest} = opts;

	let createErrorMessage;

	return waitForCondition(async () => {
		const isElementItemDisplayed = await element[elementAction.isDisplayed]();

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
		const isElementItemPresented = await element[elementAction.isPresent]();

		createErrorMessage = () => `Expected element presented state should be ${isPresented} current state is ${isElementItemPresented}`;

		return isPresented === isElementItemPresented;
	}, {
		createMessage: message ? () => message : createErrorMessage, ...rest,
	});
}

async function waitForEnabled(element, isEnabled: boolean, opts: IWaitConditionOpts = {}) {
	const {message, ...rest} = opts;

	let createErrorMessage;

	return waitForCondition(async () => {
		const isElementItemEnabled = await element[elementAction.isEnabled]();

		createErrorMessage = () => `Expected element enabled state should be ${isEnabled} current state is ${isElementItemEnabled}`;

		return isEnabled === isElementItemEnabled;
	}, {
		createMessage: message ? () => message : createErrorMessage, ...rest,
	});
};

const elementWaiters = {
	addDecorator(decorate: (originalWaiter: (...args: any[]) => Promise<void>, ...args: any[]) => unknown) {
		// ignore *addDecorator* *updateElementActionsMap* methods
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
	waitForTextIncludes,
	waitForTextEquals,
	waitForAttributeIncludes,
	waitForAttributeEquals,
}

function createElementWaiters() {
	return elementWaiters;
}

export {
	createElementWaiters,
};
