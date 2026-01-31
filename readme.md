<p align="center">
  <h1 align="center">PROMOD-SYSTEM</h1>
  <p align="center"><img style="width:350px;height:300px;" src="./.docs/promod-system.png"/></p>
  <h3 align="center">Designed for <a href="https://www.npmjs.com/package/promod">promod</a> - works with anyone</h3>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/promod-system"><img src="https://img.shields.io/npm/v/promod-system.svg" alt="npm version"></a>
  <a href="https://github.com/Simple-Automation-Testing/promod-system/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/promod-system.svg" alt="license"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/promod-system.svg" alt="node version"></a>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Reference](#api-reference)
  - [Waiters](#waiters)
  - [Test Runner](#test-runner)
  - [Code Generator](#code-generator)
  - [Reporters](#reporters)
- [Configuration](#configuration)
- [CLI Commands](#cli-commands)
- [Environment Variables](#environment-variables)
- [Examples](#examples)
- [Detailed Documentation](#detailed-documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**ProMod-System** is a comprehensive test automation framework package designed to build a modular Test Automation Framework (TAF) ecosystem. It provides a unified, framework-agnostic API for test automation that works independently of the underlying automation library (Selenium WebDriver, Playwright, Promod, etc.).

The library focuses on:

- **Framework Agnosticism**: Write tests once, run with any automation library
- **Type-Safe Code Generation**: Automatically generate action flows from page objects
- **Advanced Wait Conditions**: Sophisticated synchronization mechanisms for reliable tests
- **Rich Reporting**: Built-in console and file system reporters with customization options

---

## Features

| Feature | Description |
|---------|-------------|
| **Element Waiters** | Wait for element states, text, attributes, and visibility |
| **Browser Waiters** | Wait for URL changes, page titles, tabs, and cookies |
| **Code Generator** | Auto-generate type-safe action flows from page objects |
| **Test Runner** | Enhanced Mocha and Playwright runners with hooks and reporters |
| **Multi-Reporter** | Console and file system reporters with step tracking |
| **Collection Support** | Advanced handling of element collections with filtering |
| **Tag-Based Filtering** | Run specific test subsets using custom tags |
| **Debug Mode** | Enhanced debugging with configurable wait times |

---

## Installation

```bash
npm install promod-system
```

**Requirements:**
- Node.js >= 18.20.7

---

## Quick Start

### 1. Using Waiters

```typescript
import { seleniumWD } from 'promod';
import { createBrowserWaiters, createElementWaiters } from 'promod-system';

const { browser, $ } = seleniumWD;

(async () => {
  await getSeleniumDriver({ seleniumAddress: 'http://localhost:4444/wd/hub' }, browser);

  const browserWaiters = createBrowserWaiters(browser);
  const elementWaiters = createElementWaiters();
  const documentBody = $('body');

  await browser.get('https://www.npmjs.com/');
  await browserWaiters.waitForTabTitleIncludes('promod', { timeout: 10_000 });
  await elementWaiters.waitForTextIncludes(documentBody, 'promod', { timeout: 10_000 });
})();
```

### 2. Using the Test Runner

```typescript
import { getMochaPreparedRunner } from 'promod-system';

const { test, suite, beforeEach, afterEach, beforeAll, afterAll } = getMochaPreparedRunner({
  // Optional fixtures
});

suite('My Test Suite', function () {
  beforeAll(async function () {
    // Setup before all tests
  });

  beforeEach(async function () {
    // Setup before each test
  });

  test('should perform action', async function () {
    // Test implementation
  });

  afterEach(async function () {
    // Cleanup after each test
  });

  afterAll(async function () {
    // Cleanup after all tests
  });
});
```

---

## Architecture

ProMod-System follows a modular, layered architecture:

```
promod-system/
├── lib/
│   ├── waiters/                    # Element and browser wait conditions
│   │   ├── browser.ts              # Browser-level waiters
│   │   └── element.ts              # Element-level waiters
│   ├── base-interfaces-arguments/  # Message formatting utilities
│   ├── generator/                  # Code generation for action flows
│   │   ├── generate.pure.ts        # Pure action generation
│   │   ├── generate.pure.object.ts # Object-based action generation
│   │   ├── create.type.ts          # Type generation
│   │   └── validators.ts           # Validation utilities
│   ├── test-runner/                # Test runner implementations
│   │   ├── mocha.ts                # Mocha runner with enhancements
│   │   └── playwright.ts           # Playwright runner integration
│   ├── reporter/                   # Reporting modules
│   │   ├── console.ts              # Console reporter
│   │   └── fs.ts                   # File system reporter
│   ├── config/                     # Configuration management
│   ├── commons/                    # Shared utilities
│   └── logger/                     # Logging functionality
├── built/
│   ├── cjs/                        # CommonJS output
│   └── esm/                        # ES Modules output
└── bin/
    └── cli.js                      # CLI entry point
```

### Design Patterns

- **Factory Pattern**: `createBrowserWaiters()`, `createElementWaiters()`, `getMochaPreparedRunner()`
- **Decorator Pattern**: Waiter decorators for custom behavior
- **Observer Pattern**: Reporter pattern for test events

---

## API Reference

### Waiters

#### Browser Waiters

Create browser waiters using `createBrowserWaiters(browser)`:

| Method | Description |
|--------|-------------|
| `waitForTabTitleEqual(title, options)` | Wait for exact page title match |
| `waitForTabTitleIncludes(title, options)` | Wait for page title to include text |
| `waitForUrlEquals(url, options)` | Wait for exact URL match |
| `waitForUrlIncludes(urlPart, options)` | Wait for URL to include text |
| `waitForUrlNotIncludes(urlPart, options)` | Wait for URL to not include text |
| `waitForUrlNotEquals(url, options)` | Wait for URL to not equal |
| `waitForTabsQuantity(count, options)` | Wait for specific number of tabs |
| `waitForCookies(cookieNames, options)` | Wait for cookies to exist |
| `waitForCookiesDoNoExist(cookieNames, options)` | Wait for cookies to not exist |

#### Element Waiters

Create element waiters using `createElementWaiters()`:

| Method | Description |
|--------|-------------|
| `waitForDisplayed(element, state, options)` | Wait for element visibility |
| `waitForPresented(element, state, options)` | Wait for element presence in DOM |
| `waitForEnabled(element, state, options)` | Wait for element to be enabled |
| `waitForText(element, options)` | Wait for element to have any text |
| `waitForTextEquals(element, text, options)` | Wait for exact text match |
| `waitForTextIncludes(element, text, options)` | Wait for text to include value |
| `waitForAttributeEquals(element, attr, value, options)` | Wait for exact attribute match |
| `waitForAttributeIncludes(element, attr, value, options)` | Wait for attribute to include value |
| `waitForElementsCountEquals(elements, count, options)` | Wait for exact element count |
| `waitForElementsCountNotEquals(elements, count, options)` | Wait for count to not equal |
| `waitForElementsCountIsInRange(elements, range, options)` | Wait for count in range (e.g., `">=5 and <=10"`) |
| `waitForEveryElementTextEquals(elements, text, options)` | Wait for all elements to have exact text |
| `waitForEveryElementTextIncludes(elements, text, options)` | Wait for all elements to include text |

**Options:**
```typescript
interface WaitOptions {
  timeout?: number;    // Maximum wait time in milliseconds
  interval?: number;   // Polling interval in milliseconds
  message?: string;    // Custom error message
}
```

### Test Runner

#### Mocha Runner

```typescript
import { getMochaPreparedRunner } from 'promod-system';

const runner = getMochaPreparedRunner({
  // Optional fixtures passed to test context
});

// Available methods
runner.suite(name, fn);           // Define a test suite
runner.suite.only(name, fn);      // Run only this suite
runner.suite.skip(name, fn);      // Skip this suite
runner.suite.if(condition)(name, fn); // Conditional suite

runner.test(name, fn);            // Define a test
runner.test.only(name, fn);       // Run only this test
runner.test.skip(name, fn);       // Skip this test
runner.test.debug(name, fn);      // Run test in debug mode
runner.test.if(condition)(name, fn); // Conditional test

runner.beforeAll(fn);             // Run before all tests in suite
runner.afterAll(fn);              // Run after all tests in suite
runner.beforeEach(fn);            // Run before each test
runner.afterEach(fn);             // Run after each test
```

### Code Generator

Generate action flows from page objects:

```typescript
import { createPurePageActions, createPurePageActionsObject } from 'promod-system';

// Generate action functions
const actions = createPurePageActions(pagePath);

// Generate action object
const actionsObject = createPurePageActionsObject(pagePath);
```

### Reporters

#### Console Reporter

```typescript
import { ConsoleReporter } from 'promod-system';

const reporter = new ConsoleReporter({ isEnabled: true });

reporter.inSuite(suiteName);
reporter.startCase(caseName);
reporter.addStep(stepName);
reporter.finishStep(message, result, error);
reporter.addCustomData(data);
reporter.finishSuccessCase(caseName);
reporter.finishFailedCase(caseName, error);
reporter.addCaseProperties(opts);
```

#### File System Reporter

```typescript
import { FSReporter } from 'promod-system';

const reporter = new FSReporter({ outputPath: './reports' });
// Same API as console reporter
```

---

## Configuration

Create a `promod.system.config.js` file in your project root:

```javascript
module.exports = {
  // Path to your base library folder
  pathToBase: 'lib',

  // Element type to action mapping
  baseElementsActionsDescription: {
    Input: {
      sendKeys: { action: 'sendKeys', actionType: 'set' },
      action: { action: 'action', actionType: 'action' },
      get: { action: 'get', actionType: 'get' },
    },
    Button: {
      click: { action: 'action', actionType: 'action' },
      action: { action: 'action', actionType: 'action' },
    },
    Text: {
      get: { action: 'get', actionType: 'get' },
    },
  },

  // Collection action configurations
  baseCollectionActionsDescription: {
    // Collection-specific action definitions
  },

  // Map action names to return types
  resultActionsMap: {
    action: 'void',
    click: 'void',
    get: 'resultType',
    sendKeys: 'void',
  },

  // Library-specific identifiers
  baseLibraryDescription: {
    getPageInstance: 'getPageInstance',
    entityId: 'identifier',
    pageId: 'Page',
    fragmentId: 'Fragment',
    collectionId: 'Collection',
    waitOptionsId: 'IWaitOpts',
    getDataMethod: 'get',
    getVisibilityMethod: 'isDisplayed',
  },

  // Collection descriptor property names
  collectionDescription: {
    action: '_action',
    where: '_where',
    visible: '_visible',
    count: '_count',
    index: '_indexes',
  },

  // Human-readable action names for reporting
  prettyMethodName: {
    action: 'Click',
    sendKeys: 'Type',
    get: 'Get',
  },
};
```

---

## CLI Commands

ProMod-System provides a CLI for code generation and configuration:

```bash
# Generate configuration template
npx promod-system --generate-config

# Generate actions for a single file
npx promod-system --file="path/to/page.ts"

# Generate actions for a folder
npx promod-system --folder="pages" --pattern=".page.ts"

# Generate with TypeScript type definitions
npx promod-system --file="path/to/page.ts" --types

# Enable TypeScript support
npx promod-system --file="path/to/page.ts" --ts

# Get environment variables help
npx promod-system --envhelp

# Get CLI help
npx promod-system --clihelp
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PROMOD_S_TAGS_ID` | Tag key identifier for filtering tests by tags |
| `PROMOD_S_RECALL_AFTER_EACH` | Re-execute afterEach hook on test failure |
| `PROMOD_S_SHORE_REPORTER_ERRORS` | Handle reporter errors gracefully |
| `PROMOD_S_DEBUG_CASE` | Enable debug mode for individual tests |
| `PROMOD_S_DEBUG_CASE_TIME` | Wait time in debug mode (milliseconds) |
| `PROMOD_S_GENERATE_DEFAULT_IMPORT` | Generate default export for actions |
| `PROMOD_S_GENERATE_ACTIONS_TYPE` | Generate TypeScript type definitions |

---

## Examples

### Test Runner with Reporters Example

```typescript
import { getMochaPreparedRunner, ConsoleReporter } from 'promod-system';

const reporter = new ConsoleReporter({ isEnabled: true });

const { suite, test, beforeEach, afterEach, addReporters } = getMochaPreparedRunner({});

addReporters(() => reporter);

suite('Login Feature', function () {
  beforeEach(async function () {
    await browser.get('/login');
  });

  test('should login successfully', async function () {
    // Test implementation
  });

  afterEach(async function () {
    await browser.executeScript('window.localStorage.clear()');
  });
});
```

### Collection Handling Example

```typescript
// Usage with filtering
await itemList.action({
  _where: { text: 'Item 1' },  // Filter criteria
  _action: { clickButton: null }, // Action to perform
});

// Get data from visible items only
const visibleItems = await itemList.get({
  _visible: true,
  _action: { getText: null },
});

// Check collection count
const hasItems = await itemList.get({
  _count: '>= 1',
});
```

---

## Detailed Documentation

For more detailed documentation, see:

- [Element Waiters](.docs/elements.md) - Complete element waiter API with examples
- [Browser Waiters](.docs/browser.md) - Complete browser waiter API with examples
- [Environment Variables](.docs/env.vars.md) - Environment configuration
- [Test Runner](.docs/test-runner.md) - Test runner documentation

---

## Roadmap

- [x] Fix hardcoded values
- [x] Generate get random flows for several fields
- [x] Generate config `baseElementsActionsDescription` based on base elements library
- [ ] Config validation
- [ ] Enhanced logging
- [ ] Improved error messages
- [ ] Generate base library
- [ ] Generate project example
- [ ] Depth level flow generation

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Potapov Dmytro** - [@potapovDim](https://github.com/potapovDim)

---

## Links

- [NPM Package](https://www.npmjs.com/package/promod-system)
- [GitHub Repository](https://github.com/Simple-Automation-Testing/promod-system)
- [Issues](https://github.com/Simple-Automation-Testing/promod-system/issues)
- [Promod Library](https://www.npmjs.com/package/promod)
