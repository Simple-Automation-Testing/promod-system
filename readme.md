# PROMOD-SYSTEM

### The purpose of this library is building of the TAF ecosystem which will not  regardless of library or framework which you use for your automation testing

### This library is designed for [promod](https://www.npmjs.com/package/promod), but it can be used with any library or framework.


## Usage. [promod](https://www.npmjs.com/package/promod) example.
```js
  const {seleniumWD} = require('promod');
  const {createBrowserWaiters, createElementWaiters} = require('promod-system');

	const {browser, $} = seleniumWD;
  ;(async () => {

    await getSeleniumDriver({seleniumAddress: 'http://localhost:4444/wd/hub'}, browser);

		const browserWaiters = createBrowserWaiters(browser);
		const elementWaiters = createElementWaiters();

		const documentBody = $('body');

    await browser.get('https://www.npmjs.com/');

		await browserWaiters.waitForTabTitleIncludes('promod', {timeout: 10_000});
		await elementWaiters.waitForTextIncludes(documentBody, 'promod' {timeout: 10_000});
  })()

```