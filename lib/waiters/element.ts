import {PromodSeleniumElementType} from 'promod';
import {IWaitConditionOpts} from './interfaces';

import {waitForCondition} from 'sat-utils';


async function waitForEnabled(element: PromodSeleniumElementType, isEnabled: boolean, opts: IWaitConditionOpts = {}) {
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

async function waitForDisplayed(element: PromodSeleniumElementType, isDisplayed: boolean, opts: IWaitConditionOpts = {}) {
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

async function waitForPresented(element: PromodSeleniumElementType, isPresented: boolean, opts: IWaitConditionOpts = {}) {
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
		const keys = Object.getOwnPropertyNames(this).filter((key) => key !== 'addDecorator');
		keys.forEach((key) => {
			const initialMethodImplementation = this[key];
			this[key] = function(...args) {
				return decorate(initialMethodImplementation.bind(this, ...args), ...args);
			}
		})
	},
	waitForDisplayed,
	waitForEnabled,
	waitForPresented,
}

export {
	elementWaiters,
};
