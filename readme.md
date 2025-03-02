<p align="center">
	<h1 align="center"> PROMOD-SYSTEM </h1>
	<p align="center"><img style="width:350px;height:300px;" src="./.docs/promod-system.png"/></p>

  <h3 align="center">Designed for
	<a href="https://www.npmjs.com/package/promod">promod</a> - works with anyone
	</h3>
</p>

<h2> API </h2>
<p>
The purpose of this library is building of the TAF ecosystem which will not
regardless of library or framework which you use for your automation testing
</p>

<p><a href="/.docs/elements.md">Element(s)</a></p>
<p><a href="/.docs/browser.md">Browser</a></p>

<p><a href="/.docs/env.vars.md">PromodSystem env var usage</a></p>
<p><a href="/.docs/test-runner.md">PromodSystem test runner (powered by mocha)</a></p>
<p><a href="/.docs/system-element.md">PromodSystem base element</a></p>
<p><a href="/.docs/system-structure.md">PromodSystem base structure</a></p>
<p><a href="/.docs/system-collection.md">PromodSystem base collection</a></p>

## Usage. [promod](https://www.npmjs.com/package/promod) example.

- [Waiters](#waiters)
- [Core](#core)

### Waiters

```ts
import { seleniumWD } from 'promod';
import { createBrowserWaiters, createElementWaiters } from 'promod-system';

const { browser, $ } = seleniumWD;

;(async () => {
	await getSeleniumDriver({seleniumAddress: 'http://localhost:4444/wd/hub'}, browser);

	const browserWaiters = createBrowserWaiters(browser);
	const elementWaiters = createElementWaiters();
	const documentBody = $('body');

	await browser.get('https://www.npmjs.com/');
	await browserWaiters.waitForTabTitleIncludes('promod', {timeout: 10_000});
	await elementWaiters.waitForTextIncludes(documentBody, 'promod' {timeout: 10_000});
})();
```

### Core

```ts
import { waitFor } from 'sat-wait';
import { seleniumWD } from 'promod';
import { PromodSystemStructure } from 'promod-system';

import type { PromodElementType } from 'promod/built/interface';

const timeouts = {
	s: 5000,
	m: 10000,
	l: 15000,
	xl: 25000,
}


class BaseElement extends PromodSystemElement<PromodElementType> {
  constructor(locator: string, name: string, rootElement) {
    super(locator, name, rootElement);
  }

	/**
	 * @info
	 * this method should be overridden,
	 * method will be execute to wait visibility before next base methods
	 * sendKeys, get, action
	 * ! for isDisplayed method waitLoadedState will not be executed.
	 */
  async waitLoadedState() {
    await waitForCondition(async () => this.rootElement.isDisplayed(), {
			message: `Element ${this.identifier} with root selector ${this.rootLocator}
should become visible during ${timeouts.l} ms.`
			timeout: timeouts.l
		});
  }

	/**
	 * @info
	 * this method should be overridden,
	 * method will be execute inside sendKeys method
	 * depends on base library/framework specific
	 */
  async baseSendKeys(value): Promise<void> {
    await this.rootElement.sendKeys(value);
  }

	/**
	 * @info
	 * this method should be overridden,
	 * method will be execute inside get method
	 * depends on base library/framework specific
	 */
  async baseGetData(): Promise<{ background: any; value: any }> {
    return browser.executeScript(() =>  {
      	const background = arguments[0].style.background;
				const value = arguments[0].value;
				const rect = arguments[0].getBoundingClientRect();
				const text = arguments[0].innerText.trim()

				return {background, value, rect, text}
		}, this.rootElement.getEngineElement());
  }
}

class BaseFragment extends PromodSystemStructure {
  constructor(locator: string, name: string, rootElement: PromodElementType) {
    super(locator, name, rootElement);
  }

  init(locator: string, name: string, Child: new (...args) => any, ...rest) {
    return new Child(locator, name, this.rootElement.$(locator), ...rest);
  }

	initCollection(locator: string, name: string, Collection: new (...args) => any, Child: new (...args) => any) {
    return new Collection(locator, name, this.rootElement.$$(locator), Child);
  }

	/**
	 * @info
	 * this method should be overridden, it will be execute to wait visibility before next base methods
	 * sendKeys, get, action
	 * ! for isDisplayed method waitLoadedState will not be executed.
	 */
  async waitLoadedState() {
    await waitForCondition(async () => this.rootElement.isDisplayed(), {
			message: `Fragment ${this.identifier} with root selector ${this.rootLocator}
should become visible during ${timeouts.l} ms.`
			timeout: timeouts.l
		});
  }
}

class BasePage extends PromodSystemStructure {
  constructor(locator: string, pageName: string) {
    super(locator, structureName, $(locator));
  }

  init(locator: string, name: string, Child: new (...args) => any) {
    return new Child(locator, name, this.rootElement.$(locator));
  }

  initCollection(locator: string, name: string, Collection: new (...args) => any, Child: new (...args) => any) {
    return new Collection(locator, name, this.rootElement.$$(locator), Child);
  }

	/**
	 * @info
	 * this method should be overridden,
	 * method will be execute to wait visibility before next base methods
	 * sendKeys, get, action
	 * ! for isDisplayed method waitLoadedState will not be executed.
	 */
  async waitLoadedState() {
    await waitForCondition(async () => this.rootElement.isDisplayed(), {
			message: `Page ${this.identifier} with root selector ${this.rootLocator}
			should become visible during ${timeouts.l} ms.`
			timeout: timeouts.l
		});
  }
}
```

## Improvement/new features plan

- [x] Fix hardcoded values
- [x] Generate get random flows for several fields
- [ ] Config validation
- [ ] Logging
- [ ] Error messages
- [x] Generate config `baseElementsActionsDescription` part based on base elements library
- [ ] Generate base library
- [ ] Generate project example
- [ ] Вepth level flow generation
