/* eslint-disable no-only-tests/no-only-tests, sonarjs/cognitive-complexity */
import { isString, isNotEmptyArray, toArray, isObject, isFunction, isAsyncFunction } from 'sat-utils';
import { reportersManager } from '../reporter';
import { getArgumentTags, shouldRecallAfterEachOnFail } from './setup';

import type { TreporterInstance } from '../reporter';

type TtestOpts = {
  [k: string]: string | string[];
};

type TtestBody<T> = (fixtures?: T) => Promise<void> | any;
type TdescribeBody<T> = (fixtures?: T) => void;

const reportersCreators: (() => TreporterInstance)[] = [];

/**
 * @param {string|string[]} tags test cases tags
 * @returns {boolean}
 */
function checkExecutionTags(testTags?: string | string[]): boolean {
  const tags = toArray(testTags);
  const processTags = getArgumentTags();

  if (isNotEmptyArray(processTags) && isNotEmptyArray(tags)) {
    return processTags.some(processArgTag => tags.includes(processArgTag));
  } else if (isNotEmptyArray(processTags)) {
    return false;
  }

  return true;
}

function getPreparedRunner<T>(fixtures?: T) {
  let _beforeEachCase;
  let _afterEachCase;
  let _afterAllCases;
  let _beforeAllCases;

  let _customTestPreExecution: () => Promise<boolean>;
  let _customTestPostExecution: () => Promise<boolean>;

  let _customSuiteHook: () => void;

  let _updateSuiteName: (suiteTitle: string) => string;
  let _updateCaseName: (caseName: string) => string;

  const runner = {
    suite,
    test,
    beforeEach,
    afterEach,
    beforeAll,
    afterAll,
    customSuiteHook,
    updateSuiteName,
    updateCaseName,
    addReporters,
  };

  function testBodyWrapper(testName, fn) {
    return async function () {
      try {
        if (isFunction(_customTestPreExecution) || isAsyncFunction(_customTestPreExecution)) {
          const result = await _customTestPreExecution();
          if (!result) {
            return;
          }
        }
        reportersCreators.forEach(r => reportersManager.addReporter(r()));
        await reportersManager.startCase(testName);

        if (_beforeEachCase) {
          await _beforeEachCase.call(this, fixtures);
        }

        await fn.call(this, fixtures);

        if (_afterEachCase) {
          await _afterEachCase.call(this, fixtures);
        }

        if (isFunction(_customTestPostExecution) || isAsyncFunction(_customTestPostExecution)) {
          const result = await _customTestPostExecution();
          if (!result) {
            return;
          }
        }

        await reportersManager.finishSuccessCase(testName);
        reportersManager.reset();
      } catch (error) {
        await reportersManager.finishFailedCase(testName, error);
        reportersManager.reset();

        if (shouldRecallAfterEachOnFail() && _afterEachCase) {
          await _afterEachCase.call(this);
        }

        throw error;
      }
    };
  }

  function test(testName: string, opts: TtestOpts | TtestBody<T>, fn?: TtestBody<T>) {
    if (!checkExecutionTags((opts as TtestOpts)[process.env.PROMOD_S_TAGS_ID || 'tags'])) {
      return;
    }

    if (!isObject(opts)) {
      fn = opts as TtestBody<T>;
    }
    if (isFunction(_updateCaseName)) {
      const result = _updateCaseName(testName);
      if (isString(result)) {
        testName = result;
      }
    }

    global.it(testName, testBodyWrapper(testName, fn));
  }

  /**
   * @param {string} testName test case title
   * @param {object|(fixtures?: any) => Promise<void> | any} opts test cases configuration options, or test case body
   * @param {(fixtures?: any) => Promise<void> | any} [fn] test case body
   * @returns {void}
   */
  test.only = function testOnly(testName, opts: TtestOpts | TtestBody<T>, fn?: TtestBody<T>) {
    if (!isObject(opts)) {
      fn = opts as TtestBody<T>;
    }
    global.it.only(testName, testBodyWrapper(testName, fn));
  };

  /**
   * @param {string} skipReason test case skip reason
   * @param {string} testName test case title
   * @param {object|(fixtures?: any) => Promise<void> | any} opts test cases configuration options, or test case body
   * @param {(fixtures?: any) => Promise<void> | any} [fn] test case body
   * @returns {void}
   */
  test.skip = function testSkip(
    skipReason: string,
    testName: string,
    opts: TtestOpts | TtestBody<T>,
    fn?: TtestBody<T>,
  ) {
    if (!isObject(opts)) {
      fn = opts as TtestBody<T>;
    }
    global.it.skip(`${skipReason} ${testName}`, testBodyWrapper(testName, fn));
  };

  /**
   * @param {() => boolean} condition condition check
   * @param {string} testName test case title
   * @param {object|(fixtures?: any) => Promise<void> | any} opts test cases configuration options, or test case body
   * @param {(fixtures?: any) => Promise<void> | any} [fn] test case body
   * @returns {void}
   */
  test.if = function testIf(condition, testName, opts: TtestOpts | TtestBody<T>, fn?: TtestBody<T>) {
    if (!isObject(opts)) {
      fn = opts as TtestBody<T>;
    }
    if (condition()) {
      test(testName, opts, fn);
    } else {
      global.it.skip(testName, testBodyWrapper(testName, fn));
    }
  };

  function suiteBodyWrapper(suiteName, cb: TdescribeBody<T>) {
    if (isFunction(_customSuiteHook)) {
      _customSuiteHook.call(this, this);
    }

    if (isFunction(_afterAllCases)) {
      global.after(_afterAllCases);
    } else if (isAsyncFunction(_afterAllCases)) {
      global.after(async function () {
        await _afterAllCases.call(this);
      });
    }

    if (isFunction(_beforeAllCases)) {
      global.before(_beforeAllCases);
    } else if (isAsyncFunction(_beforeAllCases)) {
      global.before(async function () {
        await _beforeAllCases.call(this);
      });
    }

    cb.call(this, fixtures);
  }

  function suite(suiteName, cb: TdescribeBody<T>) {
    if (isFunction(_updateSuiteName)) {
      const updated = _updateSuiteName(suiteName);
      if (isString(updated)) {
        suiteName = updated;
      }
    }

    global.describe(suiteName, function () {
      suiteBodyWrapper.call(this, suiteName, cb);
    });
  }

  suite.if = function suiteIf(condition: () => boolean, suiteName: string, cb: TdescribeBody<T>) {
    if (condition()) {
      suite(suiteName, cb);
    } else {
      global.describe.skip(suiteName, function () {
        cb.call(this, fixtures);
      });
    }
  };

  suite.skip = function suiteSkip(suiteName, cb: TdescribeBody<T>) {
    if (isFunction(_updateSuiteName)) {
      const updated = _updateSuiteName(suiteName);
      if (isString(updated)) {
        suiteName = updated;
      }
    }
    global.describe.skip(suiteName, function () {
      suiteBodyWrapper.call(this, suiteName, cb);
    });
  };

  suite.only = function suiteOnly(suiteName, cb: TdescribeBody<T>) {
    if (isFunction(_updateSuiteName)) {
      const updated = _updateSuiteName(suiteName);
      if (isString(updated)) {
        suiteName = updated;
      }
    }
    global.describe.only(suiteName, function () {
      suiteBodyWrapper.call(this, suiteName, cb);
    });
  };

  function beforeEach(fn: TtestBody<T>) {
    _beforeEachCase = async function () {
      await fn.call(this, fixtures);
    };

    return runner;
  }

  function afterEach(fn: TtestBody<T>) {
    _afterEachCase = async function () {
      await fn.call(this, fixtures);
    };

    return runner;
  }

  function beforeAll(fn: TtestBody<T>) {
    _beforeAllCases = async function () {
      await fn.call(this, fixtures);
    };

    return runner;
  }

  function afterAll(fn: TtestBody<T>) {
    _afterAllCases = async function () {
      await fn.call(this, fixtures);
    };

    return runner;
  }

  function updateSuiteName(fn: (suiteTitle: string) => string) {
    _updateSuiteName = fn;
  }

  function updateCaseName(fn: (caseTitle: string) => string) {
    _updateCaseName = fn;
  }

  function addReporters(createReporter: () => TreporterInstance | (() => TreporterInstance)[]) {
    // @ts-ignore
    reportersCreators.push(...toArray(createReporter));

    return runner;
  }

  function customSuiteHook(fn: (...args) => any) {
    _customSuiteHook = fn;
  }

  return runner;
}

export { getPreparedRunner };
