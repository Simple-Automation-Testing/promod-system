/* eslint-disable no-console */
import { strict as assert } from 'node:assert';
import * as path from 'node:path';

// ── Mock setup ──────────────────────────────────────────────────────────────
// We inject mocks into require.cache BEFORE requiring the playwright wrapper,
// because TS `import` statements are hoisted.

type MockCall = { method: string; args: any[] };
let calls: MockCall[] = [];

function record(method: string, ...args: any[]) {
  calls.push({ method, args });
}

function createBaseMock() {
  const base: any = function (name, fn) {
    record('base', name, fn);
  };
  base.only = function (name, fn) {
    record('base.only', name, fn);
  };
  base.skip = function (name, fn) {
    record('base.skip', name, fn);
  };
  base.describe = function (name, fn) {
    record('base.describe', name, fn);
    fn.call({});
  };
  base.describe.only = function (name, fn) {
    record('base.describe.only', name, fn);
    fn.call({});
  };
  base.describe.skip = function (name, fn) {
    record('base.describe.skip', name, fn);
    fn.call({});
  };
  base.beforeAll = function (fn) {
    record('base.beforeAll', fn);
  };
  base.afterAll = function (fn) {
    record('base.afterAll', fn);
  };

  return base;
}

const baseMock = createBaseMock();

function makeCacheEntry(resolvedPath: string, exports: any): NodeModule {
  return {
    id: resolvedPath,
    filename: resolvedPath,
    loaded: true,
    children: [],
    paths: [],
    exports,
    path: path.dirname(resolvedPath),
    require: require as any,
  } as any;
}

// ── Mock @playwright/test ───────────────────────────────────────────────────
const playwrightTestPath = require.resolve('@playwright/test');
const originalPwCacheEntry = require.cache[playwrightTestPath];
require.cache[playwrightTestPath] = makeCacheEntry(playwrightTestPath, { test: baseMock });

// ── Mock ./setup (uses yargs which is ESM-only in v18) ──────────────────────
const setupPath = require.resolve('../../lib/test-runner/setup');
const originalSetupCacheEntry = require.cache[setupPath];
require.cache[setupPath] = makeCacheEntry(setupPath, {
  getArgumentTags: () => [],
  shouldRecallAfterEachOnFail: () => Boolean(process.env.PROMOD_S_RECALL_AFTER_EACH),
});

// Now require the playwright wrapper via CJS require — import would be hoisted
const {
  getPwPreparedRunner,
  pwAdditionalSuiteCall,
  setPwGlobalIsRunnable,
} = require('../../lib/test-runner/playwright') as typeof import('../../lib/test-runner/playwright');

// ── promod + playwright for real browser tests ──────────────────────────────
const { playwrightWD, toPwConfig } = require('promod');
const { browser, $, $$ } = playwrightWD;
const pw = require('playwright');

// ── Helpers ─────────────────────────────────────────────────────────────────

function resetCalls() {
  calls = [];
}

function findCall(method: string, index = 0): MockCall | undefined {
  const matches = calls.filter(c => c.method === method);
  return matches[index];
}

function findCalls(method: string): MockCall[] {
  return calls.filter(c => c.method === method);
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('playwright test runner wrapper', function () {
  afterEach(() => resetCalls());

  // ────────────────────────────────────────────────────────────────────────
  // getPwPreparedRunner — test registration
  // ────────────────────────────────────────────────────────────────────────
  describe('test()', function () {
    it('calls base() with name and a wrapped body function', function () {
      const runner = getPwPreparedRunner({});
      const body = async () => {};
      runner.test('my test', body);

      const call = findCall('base');
      assert.ok(call, 'base() should be called');
      assert.equal(call.args[0], 'my test');
      assert.equal(typeof call.args[1], 'function', 'second arg should be the wrapped body');
    });

    it('passes opts through when opts object is given', function () {
      const runner = getPwPreparedRunner({});
      const body = async () => {};
      runner.test('t', { custom: 'val' }, body);

      const call = findCall('base');
      assert.ok(call);
      assert.equal(call.args[0], 't');
    });

    it('works with fn-only signature (no opts)', function () {
      const runner = getPwPreparedRunner({});
      const body = async () => {};
      runner.test('t', body);

      const call = findCall('base');
      assert.ok(call);
      assert.equal(call.args[0], 't');
    });

    it('calls base.skip() when isRunnable returns false', function () {
      const runner = getPwPreparedRunner({});
      const body = async () => {};
      runner.test('skippable', { isRunnable: () => false }, body);

      assert.equal(findCalls('base').length, 0, 'base() should NOT be called');
      const skip = findCall('base.skip');
      assert.ok(skip, 'base.skip() should be called');
      assert.equal(skip.args[0], 'skippable');
    });

    it('calls base() when isRunnable returns true', function () {
      const runner = getPwPreparedRunner({});
      const body = async () => {};
      runner.test('runnable', { isRunnable: () => true }, body);

      const call = findCall('base');
      assert.ok(call, 'base() should be called');
      assert.equal(call.args[0], 'runnable');
    });

    it('passes fn.toString() as 3rd arg to isRunnable', function () {
      const runner = getPwPreparedRunner({});
      let receivedArgs: any[] = [];
      const body = async function myTestBody() {};
      runner.test('t', {
        isRunnable: (...args) => {
          receivedArgs = args;
          return true;
        },
      }, body);

      assert.equal(receivedArgs[0], 't');
      assert.equal(typeof receivedArgs[1], 'object');
      assert.equal(receivedArgs[2], body.toString());
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // test.only()
  // ────────────────────────────────────────────────────────────────────────
  describe('test.only()', function () {
    it('calls base.only() with name and wrapped body', function () {
      const runner = getPwPreparedRunner({});
      const body = async () => {};
      runner.test.only('only test', body);

      const call = findCall('base.only');
      assert.ok(call);
      assert.equal(call.args[0], 'only test');
      assert.equal(typeof call.args[1], 'function');
    });

    it('applies updateCaseName transformation', function () {
      const runner = getPwPreparedRunner({});
      runner.updateCaseName(() => 'transformed');
      runner.test.only('original', async () => {});

      const call = findCall('base.only');
      assert.ok(call);
      assert.equal(call.args[0], 'transformed');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // test.skip()
  // ────────────────────────────────────────────────────────────────────────
  describe('test.skip()', function () {
    it('calls base.skip() with "${skipReason} ${testName}"', function () {
      const runner = getPwPreparedRunner({});
      runner.test.skip('SKIP_REASON', 'the test', async () => {});

      const call = findCall('base.skip');
      assert.ok(call);
      assert.equal(call.args[0], 'SKIP_REASON the test');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // test.debug()
  // ────────────────────────────────────────────────────────────────────────
  describe('test.debug()', function () {
    it('calls base.only() when string-first-arg signature is used', function () {
      const runner = getPwPreparedRunner({});
      const body = async () => {};
      runner.test.debug('my debug test', body);

      const call = findCall('base.only');
      assert.ok(call, 'base.only() should be called');
      assert.equal(call.args[0], 'my debug test');
    });

    it('calls base.only() with numeric-first-arg signature', function () {
      const runner = getPwPreparedRunner({});
      const body = async () => {};
      runner.test.debug(3000, 'debug with time', body);

      const call = findCall('base.only');
      assert.ok(call, 'base.only() should be called');
      assert.equal(call.args[0], 'debug with time');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // test.if()
  // ────────────────────────────────────────────────────────────────────────
  describe('test.if()', function () {
    it('calls test (base()) when condition returns true', function () {
      const runner = getPwPreparedRunner({});
      runner.test.if(() => true, 'conditional', async () => {});

      const call = findCall('base');
      assert.ok(call, 'base() should be called');
      assert.equal(call.args[0], 'conditional');
    });

    it('calls base.skip() when condition returns false', function () {
      const runner = getPwPreparedRunner({});
      runner.test.if(() => false, 'conditional', async () => {});

      const skip = findCall('base.skip');
      assert.ok(skip, 'base.skip() should be called');
      assert.equal(skip.args[0], 'conditional');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // suite()
  // ────────────────────────────────────────────────────────────────────────
  describe('suite()', function () {
    it('calls base.describe() with suite name', function () {
      const runner = getPwPreparedRunner({});
      runner.suite('my suite', () => {});

      const call = findCall('base.describe');
      assert.ok(call);
      assert.equal(call.args[0], 'my suite');
    });

    it('applies updateSuiteName transformation', function () {
      const runner = getPwPreparedRunner({});
      runner.updateSuiteName(() => 'new name');
      runner.suite('old name', () => {});

      const call = findCall('base.describe');
      assert.ok(call);
      assert.equal(call.args[0], 'new name');
    });

    it('invokes the suite body synchronously', function () {
      const runner = getPwPreparedRunner({});
      let called = false;
      runner.suite('s', () => {
        called = true;
      });
      assert.ok(called, 'suite body should run synchronously');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // suite.only()
  // ────────────────────────────────────────────────────────────────────────
  describe('suite.only()', function () {
    it('calls base.describe.only()', function () {
      const runner = getPwPreparedRunner({});
      runner.suite.only('only suite', () => {});

      const call = findCall('base.describe.only');
      assert.ok(call);
      assert.equal(call.args[0], 'only suite');
    });

    it('applies updateSuiteName transformation', function () {
      const runner = getPwPreparedRunner({});
      runner.updateSuiteName(() => 'updated only');
      runner.suite.only('original', () => {});

      const call = findCall('base.describe.only');
      assert.ok(call);
      assert.equal(call.args[0], 'updated only');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // suite.skip()
  // ────────────────────────────────────────────────────────────────────────
  describe('suite.skip()', function () {
    it('calls base.describe.skip()', function () {
      const runner = getPwPreparedRunner({});
      runner.suite.skip('skipped suite', () => {});

      const call = findCall('base.describe.skip');
      assert.ok(call);
      assert.equal(call.args[0], 'skipped suite');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // suite.if()
  // ────────────────────────────────────────────────────────────────────────
  describe('suite.if()', function () {
    it('calls base.describe() when condition is true', function () {
      const runner = getPwPreparedRunner({});
      runner.suite.if(() => true, 'cond suite', () => {});

      const call = findCall('base.describe');
      assert.ok(call);
      assert.equal(call.args[0], 'cond suite');
    });

    it('calls base.describe.skip() when condition is false', function () {
      const runner = getPwPreparedRunner({});
      runner.suite.if(() => false, 'cond suite', () => {});

      const call = findCall('base.describe.skip');
      assert.ok(call);
      assert.equal(call.args[0], 'cond suite');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Suite registers beforeAll / afterAll hooks
  // ────────────────────────────────────────────────────────────────────────
  describe('suite lifecycle hooks registration', function () {
    it('registers base.beforeAll when beforeAll is set', function () {
      const runner = getPwPreparedRunner({});
      runner.beforeAll(async () => {});
      runner.suite('s', () => {});

      const call = findCall('base.beforeAll');
      assert.ok(call, 'base.beforeAll should be called');
    });

    it('registers base.afterAll when afterAll is set', function () {
      const runner = getPwPreparedRunner({});
      runner.afterAll(async () => {});
      runner.suite('s', () => {});

      const call = findCall('base.afterAll');
      assert.ok(call, 'base.afterAll should be called');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // testBodyWrapper execution flow
  // ────────────────────────────────────────────────────────────────────────
  describe('testBodyWrapper execution flow', function () {
    it('calls beforeEach -> fn -> afterEach on success', async function () {
      const order: string[] = [];
      const runner = getPwPreparedRunner({});
      runner.beforeEach(async () => order.push('beforeEach'));
      runner.afterEach(async () => order.push('afterEach'));

      const body = async () => order.push('body');
      runner.test('flow', body);

      const call = findCall('base');
      assert.ok(call);
      const wrappedBody = call.args[1];
      await wrappedBody.call({});

      assert.deepEqual(order, ['beforeEach', 'body', 'afterEach']);
    });

    it('calls reporter finishSuccessCase + reset on success', async function () {
      const reported: string[] = [];
      const runner = getPwPreparedRunner({});
      runner.addReporters(() => ({
        finishSuccessCase: (title) => { reported.push('success:' + title); },
      }));

      runner.test('success case', async () => {});

      const call = findCall('base');
      const wrappedBody = call.args[1];
      await wrappedBody.call({});

      assert.ok(reported.includes('success:success case'));
    });

    it('calls reporter finishFailedCase + reset on error, re-throws', async function () {
      const reported: string[] = [];
      const runner = getPwPreparedRunner({});
      runner.addReporters(() => ({
        finishFailedCase: (title) => { reported.push('failed:' + title); },
      }));

      const err = new Error('boom');
      runner.test('fail case', async () => { throw err; });

      const call = findCall('base');
      const wrappedBody = call.args[1];
      await assert.rejects(() => wrappedBody.call({}), (e: Error) => {
        assert.equal(e, err);
        return true;
      });

      assert.ok(reported.includes('failed:fail case'));
    });

    it('afterTest fixture: callbacks execute after body', async function () {
      const order: string[] = [];
      const runner = getPwPreparedRunner({});

      runner.test('afterTest', async (fixtures: any) => {
        fixtures.afterTest(() => order.push('afterTest-cb'));
        order.push('body');
      });

      const call = findCall('base');
      const wrappedBody = call.args[1];
      await wrappedBody.call({});

      assert.deepEqual(order, ['body', 'afterTest-cb']);
    });

    it('checkTest returning false prevents test body execution', async function () {
      let bodyCalled = false;
      const runner = getPwPreparedRunner({});
      runner.checkTest(() => false);
      runner.test('blocked', async () => { bodyCalled = true; });

      const call = findCall('base');
      const wrappedBody = call.args[1];
      await wrappedBody.call({});

      assert.equal(bodyCalled, false, 'body should not have been called');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // beforeAll error handling
  // ────────────────────────────────────────────────────────────────────────
  describe('beforeAll error handling', function () {
    it('wraps in try-catch and re-throws', async function () {
      const runner = getPwPreparedRunner({});
      const err = new Error('beforeAll boom');
      runner.beforeAll(async () => { throw err; });
      runner.suite('s', () => {});

      const baCall = findCall('base.beforeAll');
      assert.ok(baCall);
      const beforeAllFn = baCall.args[0];

      const origError = console.error;
      console.error = () => {};
      try {
        await assert.rejects(() => beforeAllFn.call({}), (e: Error) => {
          assert.equal(e, err);
          return true;
        });
      } finally {
        console.error = origError;
      }
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Lifecycle hooks return runner (chaining)
  // ────────────────────────────────────────────────────────────────────────
  describe('lifecycle hooks chaining', function () {
    it('beforeEach returns runner', function () {
      const runner = getPwPreparedRunner({});
      const result = runner.beforeEach(async () => {});
      assert.equal(result, runner);
    });

    it('afterEach returns runner', function () {
      const runner = getPwPreparedRunner({});
      const result = runner.afterEach(async () => {});
      assert.equal(result, runner);
    });

    it('beforeAll returns runner', function () {
      const runner = getPwPreparedRunner({});
      const result = runner.beforeAll(async () => {});
      assert.equal(result, runner);
    });

    it('afterAll returns runner', function () {
      const runner = getPwPreparedRunner({});
      const result = runner.afterAll(async () => {});
      assert.equal(result, runner);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // afterEach re-runs on failure when PROMOD_S_RECALL_AFTER_EACH is set
  // ────────────────────────────────────────────────────────────────────────
  describe('afterEach recall on failure', function () {
    it('re-runs afterEach when PROMOD_S_RECALL_AFTER_EACH is set and test throws', async function () {
      const origEnv = process.env.PROMOD_S_RECALL_AFTER_EACH;
      process.env.PROMOD_S_RECALL_AFTER_EACH = 'true';

      try {
        let afterEachCount = 0;
        const runner = getPwPreparedRunner({});
        runner.afterEach(async () => { afterEachCount++; });
        runner.test('failing', async () => { throw new Error('fail'); });

        const call = findCall('base');
        const wrappedBody = call.args[1];
        try {
          await wrappedBody.call({});
        } catch {
          // expected
        }

        assert.equal(afterEachCount, 1, 'afterEach should run once (recall in catch block since normal afterEach was skipped)');
      } finally {
        if (origEnv === undefined) {
          delete process.env.PROMOD_S_RECALL_AFTER_EACH;
        } else {
          process.env.PROMOD_S_RECALL_AFTER_EACH = origEnv;
        }
      }
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Reporters
  // ────────────────────────────────────────────────────────────────────────
  describe('reporters', function () {
    it('function reporters are instantiated and added', async function () {
      let startCalled = false;
      const runner = getPwPreparedRunner({});
      runner.addReporters(() => ({
        startCase: () => { startCalled = true; },
      }));

      runner.test('r', async () => {});
      const call = findCall('base');
      await call.args[1].call({});

      assert.ok(startCalled);
    });

    it('object reporters are added directly', async function () {
      let startCalled = false;
      const runner = getPwPreparedRunner({});
      runner.addReporters(({
        startCase: () => { startCalled = true; },
      }) as any);

      runner.test('r', async () => {});
      const call = findCall('base');
      await call.args[1].call({});

      assert.ok(startCalled);
    });

    it('reporter lifecycle: logTestBody -> startCase -> addCaseProperties -> finishSuccessCase', async function () {
      const order: string[] = [];
      const runner = getPwPreparedRunner({});
      runner.addReporters(() => ({
        logTestBody: () => { order.push('logTestBody'); },
        startCase: () => { order.push('startCase'); },
        addCaseProperties: () => { order.push('addCaseProperties'); },
        finishSuccessCase: () => { order.push('finishSuccessCase'); },
      }));

      runner.test('lifecycle', { x: 1 }, async () => {});
      const call = findCall('base');
      await call.args[1].call({});

      assert.deepEqual(order, ['logTestBody', 'startCase', 'addCaseProperties', 'finishSuccessCase']);
    });

    it('reporter errors do not break test execution when PROMOD_S_SHORE_REPORTER_ERRORS is set', async function () {
      const origEnv = process.env.PROMOD_S_SHORE_REPORTER_ERRORS;
      process.env.PROMOD_S_SHORE_REPORTER_ERRORS = 'true';

      const origWarn = console.warn;
      console.warn = () => {};

      try {
        let bodyCalled = false;
        const runner = getPwPreparedRunner({});
        runner.addReporters(() => ({
          startCase: () => { throw new Error('reporter error'); },
        }));

        runner.test('safe', async () => { bodyCalled = true; });
        const call = findCall('base');
        await call.args[1].call({});

        assert.ok(bodyCalled, 'test body should still execute');
      } finally {
        console.warn = origWarn;
        if (origEnv === undefined) {
          delete process.env.PROMOD_S_SHORE_REPORTER_ERRORS;
        } else {
          process.env.PROMOD_S_SHORE_REPORTER_ERRORS = origEnv;
        }
      }
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Configuration methods
  // ────────────────────────────────────────────────────────────────────────
  describe('configuration methods', function () {
    it('updateCaseName transforms test names', function () {
      const runner = getPwPreparedRunner({});
      runner.updateCaseName((name) => name.toUpperCase());
      runner.test('hello', async () => {});

      const call = findCall('base');
      assert.ok(call);
      assert.equal(call.args[0], 'HELLO');
    });

    it('updateSuiteName transforms suite names', function () {
      const runner = getPwPreparedRunner({});
      runner.updateSuiteName((name) => name.toUpperCase());
      runner.suite('hello', () => {});

      const call = findCall('base.describe');
      assert.ok(call);
      assert.equal(call.args[0], 'HELLO');
    });

    it('customSuiteHook is called inside suite body', function () {
      const runner = getPwPreparedRunner({});
      let hookCalled = false;
      runner.customSuiteHook(() => { hookCalled = true; });
      runner.suite('s', () => {});

      assert.ok(hookCalled, 'customSuiteHook should be called');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // addReporters returns runner (chaining)
  // ────────────────────────────────────────────────────────────────────────
  describe('addReporters chaining', function () {
    it('addReporters returns runner', function () {
      const runner = getPwPreparedRunner({});
      const result = runner.addReporters(() => ({}));
      assert.equal(result, runner);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Module-level exports
  // ────────────────────────────────────────────────────────────────────────
  describe('pwAdditionalSuiteCall', function () {
    it('throws TypeError for non-function', function () {
      assert.throws(() => pwAdditionalSuiteCall('not a function' as any), TypeError);
    });

    it('callback is called inside suite body', function () {
      let called = false;
      pwAdditionalSuiteCall(() => { called = true; });

      const runner = getPwPreparedRunner({});
      runner.suite('s', () => {});

      assert.ok(called, 'additional suite call should be invoked');
    });
  });

  describe('setPwGlobalIsRunnable', function () {
    afterEach(() => {
      try {
        setPwGlobalIsRunnable(() => true);
      } catch {
        // ignore
      }
    });

    it('throws TypeError for non-function', function () {
      assert.throws(() => setPwGlobalIsRunnable('not a function' as any), TypeError);
    });

    it('applies isRunnable to tests — skips when returns false', function () {
      setPwGlobalIsRunnable(() => false);
      const runner = getPwPreparedRunner({});
      runner.test('globally skipped', async () => {});

      const skip = findCall('base.skip');
      assert.ok(skip, 'base.skip() should be called');
      assert.equal(skip.args[0], 'globally skipped');
    });

    it('applies isRunnable to tests — runs when returns true', function () {
      setPwGlobalIsRunnable(() => true);
      const runner = getPwPreparedRunner({});
      runner.test('globally runnable', async () => {});

      const call = findCall('base');
      assert.ok(call, 'base() should be called');
      assert.equal(call.args[0], 'globally runnable');
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Real browser tests via promod
  // ────────────────────────────────────────────────────────────────────────
  describe('real browser via promod', function () {
    this.timeout(60000);

    before(async function () {
      const config = toPwConfig({ browserName: 'chrome', headless: true });
      const pwBrowser = await pw.chromium.launch(config.launchOptions);
      browser.setClient({ driver: pwBrowser });
      // warmup: create context/page so first test doesn't start from uninitialized state
      await browser.get('https://www.example.com');
    });

    after(async function () {
      await browser.quit();
    });

    it('testBodyWrapper receives browser fixture and can navigate', async function () {
      const fixtures = { browser, $, $$ };
      const runner = getPwPreparedRunner(fixtures);

      let pageTitle = '';
      runner.test('navigate test', async (f: any) => {
        await f.browser.get('https://www.example.com');
        // executeScript waits for the page context to be ready after navigation
        pageTitle = await f.browser.executeScript(() => document.title);
      });

      const call = findCall('base');
      assert.ok(call);
      await call.args[1].call({});

      assert.ok(pageTitle.includes('Example Domain'), `expected "Example Domain" in title, got: "${pageTitle}"`);
    });

    it('testBodyWrapper receives $ fixture and can find elements', async function () {
      const fixtures = { browser, $, $$ };
      const runner = getPwPreparedRunner(fixtures);

      let titleText = '';
      runner.test('element test', async (f: any) => {
        // page is already at example.com from previous test
        titleText = await f.$('h1').getText();
      });

      const call = findCall('base');
      assert.ok(call);
      await call.args[1].call({});

      assert.ok(titleText.length > 0, 'should have found h1 text');
      assert.ok(titleText.includes('Example Domain'), `expected "Example Domain", got: "${titleText}"`);
    });

    it('testBodyWrapper beforeEach/afterEach work with real browser fixtures', async function () {
      const fixtures = { browser, $, $$ };
      const runner = getPwPreparedRunner(fixtures);
      const order: string[] = [];

      runner.beforeEach(async (f: any) => {
        await f.browser.get('https://www.example.com');
        order.push('beforeEach');
      });
      runner.afterEach(async () => {
        order.push('afterEach');
      });

      runner.test('real lifecycle', async (f: any) => {
        const url = await f.browser.getCurrentUrl();
        assert.ok(url.includes('example.com'));
        order.push('body');
      });

      const call = findCall('base');
      assert.ok(call);
      await call.args[1].call({});

      assert.deepEqual(order, ['beforeEach', 'body', 'afterEach']);
    });

    it('reporter receives correct title with real browser test', async function () {
      const fixtures = { browser, $, $$ };
      const runner = getPwPreparedRunner(fixtures);

      let reportedTitle = '';
      runner.addReporters(() => ({
        startCase: (title: string) => { reportedTitle = title; },
        finishSuccessCase: (title: string) => { reportedTitle = title; },
      }));

      runner.test('real reporter test', async (f: any) => {
        await f.browser.get('https://www.example.com');
      });

      const call = findCall('base');
      assert.ok(call);
      await call.args[1].call({});

      assert.equal(reportedTitle, 'real reporter test');
    });

    it('testBodyWrapper failure path works with real browser', async function () {
      const fixtures = { browser, $, $$ };
      const runner = getPwPreparedRunner(fixtures);

      let failedTitle = '';
      runner.addReporters(() => ({
        finishFailedCase: (title: string) => { failedTitle = title; },
      }));

      const testErr = new Error('intentional browser test failure');
      runner.test('real failure test', async (f: any) => {
        await f.browser.get('https://www.example.com');
        throw testErr;
      });

      const call = findCall('base');
      assert.ok(call);
      await assert.rejects(() => call.args[1].call({}), (e: Error) => {
        assert.equal(e, testErr);
        return true;
      });

      assert.equal(failedTitle, 'real failure test');
    });

    it('$$ fixture can find multiple elements', async function () {
      const fixtures = { browser, $, $$ };
      const runner = getPwPreparedRunner(fixtures);

      let paragraphCount = 0;
      runner.test('elements test', async (f: any) => {
        // page is already at example.com from preceding tests
        const paragraphs = f.$$('p');
        paragraphCount = await paragraphs.count();
      });

      const call = findCall('base');
      assert.ok(call);
      await call.args[1].call({});

      assert.ok(paragraphCount > 0, `expected at least 1 paragraph, got: ${paragraphCount}`);
    });

    it('afterTest fixture callbacks run after real browser interaction', async function () {
      const fixtures = { browser, $, $$ };
      const runner = getPwPreparedRunner(fixtures);
      const order: string[] = [];

      runner.test('afterTest with browser', async (f: any) => {
        await f.browser.get('https://www.example.com');
        f.afterTest(() => order.push('afterTest-cleanup'));
        order.push('body');
      });

      const call = findCall('base');
      assert.ok(call);
      await call.args[1].call({});

      assert.deepEqual(order, ['body', 'afterTest-cleanup']);
    });

    it('executeScript works through fixtures', async function () {
      const fixtures = { browser, $, $$ };
      const runner = getPwPreparedRunner(fixtures);

      let pageTitle = '';
      runner.test('script test', async (f: any) => {
        await f.browser.get('https://www.example.com');
        pageTitle = await f.browser.executeScript(() => document.title);
      });

      const call = findCall('base');
      assert.ok(call);
      await call.args[1].call({});

      assert.ok(pageTitle.includes('Example Domain'), `expected "Example Domain" in title, got: "${pageTitle}"`);
    });
  });
});

// ── Cleanup ─────────────────────────────────────────────────────────────────
after(function () {
  if (originalPwCacheEntry) {
    require.cache[playwrightTestPath] = originalPwCacheEntry;
  } else {
    delete require.cache[playwrightTestPath];
  }
  if (originalSetupCacheEntry) {
    require.cache[setupPath] = originalSetupCacheEntry;
  } else {
    delete require.cache[setupPath];
  }
  const wrapperPath = require.resolve('../../lib/test-runner/playwright');
  delete require.cache[wrapperPath];
});
