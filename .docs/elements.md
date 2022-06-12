# Element

- [waitForAttributeIncludes](#waitforattributeincludes)
- [waitForAttributeEquals](#waitforattributeequals)
- [waitForTextIncludes](#waitfortextincludes)
- [waitForTextEquals](#waitfortextequals)
- [waitForDisplayed](#waitfordisplayed)
- [waitForPresented](#waitforpresented)
- [waitForEnabled](#waitforenabled)
- [waitForText](#waitfortext)
- [waitForElementsCountEquals](#waitforelementscountequals)
- [waitForElementsCountNotEquals](#waitforelementscountnotequals)
- [waitForElementsCountIsInRange](#waitforelementscountisinrange)
- [waitForEveryElementTextEquals](#waitforeveryelementtextequals)
- [waitForEveryElementTextIncludes](#waitforeveryelementtextincludes)


## waitForAttributeIncludes
```js
	const {seleniumWD} = require('promod');
	const {createElementWaiters} = require('promod-system');
	const {$} = seleniumWD;

	const elementWaiters = createElementWaiters();
	const el = $('.class #id div a[href*="link"]');

	;(async function () {
		await elementWaiters.waitForAttributeIncludes(el, 'attribute_name', 'expected_value_part', {timeout: 5000});
	})()
```

## waitForAttributeEquals
```js
	const {seleniumWD} = require('promod');
	const {createElementWaiters} = require('promod-system');
	const {$} = seleniumWD;

	const elementWaiters = createElementWaiters();
	const el = $('.class #id div a[href*="link"]');

	;(async function () {
		await elementWaiters.waitForAttributeEquals(el, 'attribute_name', 'expected_value', {timeout: 5000});
	})()
```

## waitForTextIncludes
```js
	const {seleniumWD} = require('promod');
	const {createElementWaiters} = require('promod-system');
	const {$} = seleniumWD;

	const elementWaiters = createElementWaiters();
	const el = $('.class #id div a[href*="link"]');

	;(async function () {
		await elementWaiters.waitForTextIncludes(el, 'expected text part', {timeout: 5000});
	})()
```

## waitForTextEquals
```js
	const {seleniumWD} = require('promod');
	const {createElementWaiters} = require('promod-system');
	const {$} = seleniumWD;

	const elementWaiters = createElementWaiters();
	const el = $('.class #id div a[href*="link"]');

	;(async function () {
		await elementWaiters.waitForTextEquals(el, 'expected text', {timeout: 5000});
	})()
```

## waitForDisplayed
```js
	const {seleniumWD} = require('promod');
	const {createElementWaiters} = require('promod-system');
	const {$} = seleniumWD;

	const elementWaiters = createElementWaiters();
	const el = $('.class #id div a[href*="link"]');

	;(async function () {
		await elementWaiters.waitForDisplayed(el, true, {timeout: 5000});
	})()
```

## waitForPresented
```js
	const {seleniumWD} = require('promod');
	const {createElementWaiters} = require('promod-system');
	const {$} = seleniumWD;

	const elementWaiters = createElementWaiters();
	const el = $('.class #id div a[href*="link"]');

	;(async function () {
		await elementWaiters.waitForPresented(el, true, {timeout: 5000});
	})()
```

## waitForPresented
```js
	const {seleniumWD} = require('promod');
	const {createElementWaiters} = require('promod-system');
	const {$} = seleniumWD;

	const elementWaiters = createElementWaiters();
	const el = $('.class #id div a[href*="link"]');

	;(async function () {
		await elementWaiters.waitForEnabled(el, true, {timeout: 5000});
	})()
```

## waitForText
```js
	const {seleniumWD} = require('promod');
	const {createElementWaiters} = require('promod-system');
	const {$} = seleniumWD;

	const elementWaiters = createElementWaiters();
	const el = $('.class #id div a[href*="link"]');

	;(async function () {
		await elementWaiters.waitForText(el, {timeout: 5000});
	})()
```

## waitForElementsCountEquals
```js
	const {seleniumWD} = require('promod');
	const {createElementWaiters} = require('promod-system');
	const {$$} = seleniumWD;

	const elementWaiters = createElementWaiters();
	const els = $$('.class #id div a[href*="link"]');

	;(async function () {
		await elementWaiters.waitForElementsCountEquals(els, 10, {timeout: 5000});
	})()
```

## waitForElementsCountNotEquals
```js
	const {seleniumWD} = require('promod');
	const {createElementWaiters} = require('promod-system');
	const {$$} = seleniumWD;

	const elementWaiters = createElementWaiters();
	const els = $$('.class #id div a[href*="link"]');

	;(async function () {
		await elementWaiters.waitForElementsCountNotEquals(els, 10, {timeout: 5000});
	})()
```

## waitForElementsCountIsInRange
```js
	const {seleniumWD} = require('promod');
	const {createElementWaiters} = require('promod-system');
	const {$$} = seleniumWD;

	const elementWaiters = createElementWaiters();
	const els = $$('.class #id div a[href*="link"]');

	;(async function () {
		await elementWaiters.waitForElementsCountIsInRange(els, '>=10 and =<20', {timeout: 5000});
	})()
```

## waitForEveryElementTextEquals
```js
	const {seleniumWD} = require('promod');
	const {createElementWaiters} = require('promod-system');
	const {$$} = seleniumWD;

	const elementWaiters = createElementWaiters();
	const els = $$('.class #id div a[href*="link"]');

	;(async function () {
		await elementWaiters.waitForEveryElementTextEquals(els, 'Text equal', {timeout: 5000});
	})()
```

## waitForEveryElementTextIncludes
```js
	const {seleniumWD} = require('promod');
	const {createElementWaiters} = require('promod-system');
	const {$$} = seleniumWD;

	const elementWaiters = createElementWaiters();
	const els = $$('.class #id div a[href*="link"]');

	;(async function () {
		await elementWaiters.waitForEveryElementTextIncludes(els, 'Text part', {timeout: 5000});
	})()
```