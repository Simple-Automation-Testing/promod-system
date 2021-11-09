# Browser

- [waitForTabTitleEqual](#waitfortabtitleequal)
- [waitForTabTitleIncludes](#waitfortabtitleincludes)
- [waitForUrlIncludes](#waitforurlincludes)
- [waitForUrlEquals](#waitforurlequals)
- [waitForTabsQuantity](#waitfortabsquantity)


## waitForTabTitleEqual
```js
	const {seleniumWD} = require('promod-system');
	const {createElementWaiters} = require('promod-system');
	const {getSeleniumDriver, browser} = seleniumWD;

	const browserWaiters = createElementWaiters(browser);

	;(async function () {
		await getSeleniumDriver({seleniumAddress: 'http://localhost:4444/wd/hub'}, browser);
		await browserWaiters.waitForTabTitleEqual('Title value', {timeout: 5000});
	})()
```

## waitForTabTitleIncludes
```js
	const {seleniumWD} = require('promod-system');
	const {createElementWaiters} = require('promod-system');
	const {getSeleniumDriver, browser} = seleniumWD;

	const browserWaiters = createElementWaiters(browser);

	;(async function () {
		await getSeleniumDriver({seleniumAddress: 'http://localhost:4444/wd/hub'}, browser);
		await browserWaiters.waitForTabTitleIncludes('Title value part', {timeout: 5000});
	})()
```

## waitForUrlIncludes
```js
	const {seleniumWD} = require('promod-system');
	const {createElementWaiters} = require('promod-system');
	const {getSeleniumDriver, browser} = seleniumWD;

	const browserWaiters = createElementWaiters(browser);

	;(async function () {
		await getSeleniumDriver({seleniumAddress: 'http://localhost:4444/wd/hub'}, browser);
		await browserWaiters.waitForUrlIncludes('url.part.com', {timeout: 5000});
	})()
```

## waitForUrlEquals
```js
	const {seleniumWD} = require('promod-system');
	const {createElementWaiters} = require('promod-system');
	const {getSeleniumDriver, browser} = seleniumWD;

	const browserWaiters = createElementWaiters(browser);

	;(async function () {
		await getSeleniumDriver({seleniumAddress: 'http://localhost:4444/wd/hub'}, browser);
		await browserWaiters.waitForUrlEquals('https://url.part.com', {timeout: 5000});
	})()
```

## waitForTabsQuantity
```js
	const {seleniumWD} = require('promod-system');
	const {createElementWaiters} = require('promod-system');
	const {getSeleniumDriver, browser} = seleniumWD;

	const browserWaiters = createElementWaiters(browser);

	;(async function () {
		await getSeleniumDriver({seleniumAddress: 'http://localhost:4444/wd/hub'}, browser);
		await browserWaiters.waitForTabsQuantity('https://url.part.com', {timeout: 5000});
	})()
```