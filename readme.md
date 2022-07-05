<p align="center">
	<h1 align="center"> PROMOD-SYSTEM </h1>
	<p align="center"><img style="width:350px;height:300px;" src="./.docs/promod-system.png"/></p>

  <h3 align="center">Designed for <a href="https://www.npmjs.com/package/promod">promod</a> - works with anyone</h3>
</p>

<h2> API </h2>
<p>
The purpose of this library is building of the TAF ecosystem which will not regardless of library or framework which you use for your automation testing
</p>

<p><a href="/.docs/elements.md">Element(s)</a></p>
<p><a href="/.docs/browser.md">Browser</a></p>
<p><a href="/.docs/system-element.md">PromodSystem base element</a></p>

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
