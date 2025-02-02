/* eslint-disable unicorn/consistent-function-scoping, no-console, no-only-tests/no-only-tests, sonarjs/cognitive-complexity */
import { test as base } from '@playwright/test';
import { isNumber, sleep, isString, isNotEmptyArray, toArray, isObject, isFunction, isAsyncFunction } from 'sat-utils';
import { getArgumentTags, shouldRecallAfterEachOnFail } from './setup';

const { PROMOD_S_SHORE_REPORTER_ERRORS, PROMOD_S_DEBUG_CASE, PROMOD_S_DEBUG_CASE_TIME } = process.env;
const { warn, error } = console;

type TtestOpts = {
  [k: string]: string | string[] | number | number[] | unknown;
};

export type TreporterInstance<Topts = TtestOpts> = {
  startCase?: (testCaseTitle: string) => void | Promise<void>;

  logTestBody?: (testBody: string | ((...args: any[]) => any | Promise<any>)) => void | Promise<void>;

  addCaseProperties?: (opts: Topts) => void | Promise<void>;
  addStep?: (stepData: string, stepArguments?: any, stepResult?: any) => void | Promise<void>;
  finishStep?: (...args) => void | Promise<void>;

  addCustomData?: (...args) => void | Promise<void>;
  log?: (...args) => void | Promise<void>;

  finishSuccessCase?: (testCaseTitle: string) => void | Promise<void>;
  finishFailedCase?: (testCaseTitle: string, error: Error) => void | Promise<void>;
};

type TtestBody<Tfixtures> = (fixtures?: Tfixtures) => Promise<void> | any;
type TcheckTestCondition<Topts = TtestOpts> = (testName: string, opts?: Topts) => boolean;
type TdescribeBody<Tfixtures> = (fixtures?: Tfixtures) => void;

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

const reportersManager = {
  addReporter: (...args) => ({}),
  startCase: (...args) => ({}),
  addCaseProperties: (...args) => ({}),
  logTestBody: (...args) => ({}),

  addStep:
    (...args): Promise<(...args) => void | Promise<void>> | ((...args) => void | Promise<void>) =>
    (...args) => {
      /** */
    },
  log: (...args) => ({}),
  addCustomData: (...args) => ({}),
  finishSuccessCase: (...args) => ({}),
  finishFailedCase: (...args) => ({}),
  reset: (...args) => ({}),
};

let _suiteAdditionalCall;
let _globalIsRunnable;

function getPreparedRunner<TRunnerFixtures, TrequiredOpts = { [k: string]: any }>(fixtures: TRunnerFixtures) {
  type Tfixtures = { afterTest: (cb: () => any) => () => any } & typeof fixtures;
  const reportersCreators: (() => TreporterInstance)[] = [];
  const _reportersManager = (() => {
    const activeReporters: TreporterInstance[] = [];

    return {
      addReporter: (reporter: TreporterInstance) => {
        activeReporters.push(reporter);
      },
      reset: () => {
        activeReporters.splice(0, activeReporters.length);
      },
      logTestBody: async (testBody: string | ((...args: any[]) => any | Promise<any>)) => {
        for (const reporter of activeReporters) {
          try {
            if (reporter.logTestBody) {
              await reporter.logTestBody(testBody);
            }
          } catch (error) {
            if (PROMOD_S_SHORE_REPORTER_ERRORS) {
              warn(error);
            }
          }
        }
      },
      startCase: async (testCaseTitle: string) => {
        for (const reporter of activeReporters) {
          try {
            if (reporter.startCase) {
              await reporter.startCase(testCaseTitle);
            }
          } catch (error) {
            if (PROMOD_S_SHORE_REPORTER_ERRORS) {
              warn(error);
            }
          }
        }
      },
      addStep: async (stepData: string, stepArguments?: any, stepResult?: any) => {
        for (const reporter of activeReporters) {
          try {
            if (reporter.addStep) {
              await reporter.addStep(stepData, stepArguments, stepResult);
            }
          } catch (error) {
            if (PROMOD_S_SHORE_REPORTER_ERRORS) {
              warn(error);
            }
          }
        }

        return _reportersManager.finishStep;
      },
      finishStep: async (...data) => {
        for (const reporter of activeReporters) {
          try {
            if (reporter.finishStep) {
              await reporter.finishStep(...data);
            }
          } catch (error) {
            if (PROMOD_S_SHORE_REPORTER_ERRORS) {
              warn(error);
            }
          }
        }
      },
      addCaseProperties: async opts => {
        for (const reporter of activeReporters) {
          try {
            if (reporter.addCaseProperties) {
              await reporter.addCaseProperties(opts);
            }
          } catch (error) {
            if (PROMOD_S_SHORE_REPORTER_ERRORS) {
              warn(error);
            }
          }
        }
      },
      addCustomData: async (...args: any[]) => {
        for (const reporter of activeReporters) {
          try {
            if (reporter.addCustomData) {
              await reporter.addCustomData(...args);
            }
          } catch (error) {
            if (PROMOD_S_SHORE_REPORTER_ERRORS) {
              warn(error);
            }
          }
        }
      },
      log: async (...args: any[]) => {
        for (const reporter of activeReporters) {
          try {
            if (reporter.log) {
              await reporter.log(...args);
            }
          } catch (error) {
            if (PROMOD_S_SHORE_REPORTER_ERRORS) {
              warn(error);
            }
          }
        }
      },
      finishSuccessCase: async (testCaseTitle: string) => {
        for (const reporter of activeReporters) {
          try {
            if (reporter.finishSuccessCase) {
              await reporter.finishSuccessCase(testCaseTitle);
            }
          } catch (error) {
            if (PROMOD_S_SHORE_REPORTER_ERRORS) {
              warn(error);
            }
          }
        }
      },
      finishFailedCase: async (testCaseTitle: string, error: Error) => {
        for (const reporter of activeReporters) {
          try {
            if (reporter.finishFailedCase) {
              await reporter.finishFailedCase(testCaseTitle, error);
            }
          } catch (error) {
            if (PROMOD_S_SHORE_REPORTER_ERRORS) {
              warn(error);
            }
          }
        }
      },
    };
  })();

  let _beforeEachCase;
  let _afterEachCase;
  let _afterAllCases;
  let _beforeAllCases;

  let _customTestPreExecution: (testTitle: string, testBodyStringified: string) => boolean | Promise<boolean>;
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
    checkTest,
  };

  function testBodyWrapper(testName, fn, opts) {
    return async function () {
      const _afterTest = [];
      const runAfterTests = async () => {
        if (_afterTest.length) {
          for (const cb of _afterTest) {
            try {
              await cb();
            } catch (error) {
              warn(error);
            }
          }
        }
      };

      const afterTestFixture = {
        afterTest: cb => {
          _afterTest.push(cb);
        },
      };

      try {
        // TODO improve this approach
        Object.assign(reportersManager, _reportersManager);

        if (isFunction(_customTestPreExecution) || isAsyncFunction(_customTestPreExecution)) {
          const result = await _customTestPreExecution(testName, fn.toString());
          if (!result) {
            return;
          }
        }
        reportersCreators.forEach(reporter => {
          if (isFunction(reporter)) {
            reportersManager.addReporter(reporter());
          } else if (isObject(reporter)) {
            reportersManager.addReporter(reporter);
          } else {
            error(`${reporter} should be an object of function that returns reporter object`);
          }
        });
        await reportersManager.logTestBody(fn.toString());
        await reportersManager.startCase(testName);
        await reportersManager.addCaseProperties(opts);

        if (_beforeEachCase) {
          await _beforeEachCase.call(this, fixtures);
        }

        const callFixtures = fixtures || {};

        Object.assign(callFixtures, afterTestFixture);

        await fn.call(this, callFixtures);

        if (_afterEachCase) {
          await _afterEachCase.call(this, fixtures);
        }

        if (isFunction(_customTestPostExecution) || isAsyncFunction(_customTestPostExecution)) {
          const result = await _customTestPostExecution();
          if (!result) {
            return;
          }
        }
        await runAfterTests();
        await reportersManager.finishSuccessCase(testName);
        reportersManager.reset();
      } catch (error) {
        await reportersManager.finishFailedCase(testName, error);
        reportersManager.reset();

        if (PROMOD_S_DEBUG_CASE) {
          console.error(error);
          console.info('Waiting for 250 seconds before next test case');
          await sleep(isNumber(+PROMOD_S_DEBUG_CASE_TIME) ? +PROMOD_S_DEBUG_CASE_TIME : 5000);
        }

        await runAfterTests();

        if (shouldRecallAfterEachOnFail() && _afterEachCase) {
          await _afterEachCase.call(this);
        }

        throw error;
      }
    };
  }

  /**
   * @param {string} testName test case title
   * @param {object|(fixtures?: any) => Promise<void> | any} opts test cases configuration options, or test case body
   * @param {(fixtures?: any) => Promise<void> | any} [fn] test case body
   * @returns {void}
   */
  function test(testName: string, opts: TrequiredOpts | TtestBody<Tfixtures>, fn?: TtestBody<Tfixtures>) {
    if (!checkExecutionTags((opts as TrequiredOpts)[process.env.PROMOD_S_TAGS_ID || 'tags'])) {
      return;
    }

    if (!isObject(opts)) {
      fn = opts as TtestBody<Tfixtures>;
      opts = {} as TrequiredOpts;
    }
    if (isFunction(_updateCaseName)) {
      const result = _updateCaseName(testName);
      if (isString(result)) {
        testName = result;
      }
    }
    if (_globalIsRunnable) {
      opts['isRunnable'] = _globalIsRunnable;
    }

    // @ts-expect-error
    if ((opts as TrequiredOpts)?.isRunnable && opts.isRunnable(testName, opts as TrequiredOpts)) {
      base(testName, testBodyWrapper(testName, fn, opts));
      // @ts-expect-error
    } else if ((opts as TrequiredOpts)?.isRunnable && !opts.isRunnable(testName, opts as TrequiredOpts)) {
      base.skip(testName, testBodyWrapper(testName, fn, opts));
    } else {
      base(testName, testBodyWrapper(testName, fn, opts));
    }
  }

  /**
   * @param {string} testName test case title
   * @param {object|(fixtures?: any) => Promise<void> | any} opts test cases configuration options, or test case body
   * @param {(fixtures?: any) => Promise<void> | any} [fn] test case body
   * @returns {void}
   */
  test.only = function testOnly(
    testName: string,
    opts: TrequiredOpts | TtestBody<Tfixtures>,
    fn?: TtestBody<Tfixtures>,
  ) {
    if (!isObject(opts)) {
      fn = opts as TtestBody<Tfixtures>;
      opts = {} as TrequiredOpts;
    }
    if (isFunction(_updateCaseName)) {
      const result = _updateCaseName(testName);
      if (isString(result)) {
        testName = result;
      }
    }
    base.only(testName, testBodyWrapper(testName, fn, opts));
  };

  /**
   * @param {number|string} waitingtime test case title or waiting time
   * @param {string} testName test case title
   * @param {object|(fixtures?: any) => Promise<void> | any} opts test cases configuration options, or test case body
   * @param {(fixtures?: any) => Promise<void> | any} [fn] test case body
   * @returns {void}
   */
  test.debug = function debug(
    waitingtime: number | string,
    testName: string | TrequiredOpts | TtestBody<Tfixtures>,
    opts?: TrequiredOpts | TtestBody<Tfixtures>,
    fn?: TtestBody<Tfixtures>,
  ) {
    if (isFunction(testName) || isAsyncFunction(testName)) {
      fn = testName as TtestBody<Tfixtures>;
    }
    if (isString(waitingtime)) {
      testName = waitingtime as string;
      waitingtime = isNumber(+PROMOD_S_DEBUG_CASE_TIME) ? +PROMOD_S_DEBUG_CASE_TIME : 5000;
    }

    if (!isObject(opts) && !(isFunction(fn) || isAsyncFunction(fn))) {
      fn = opts as TtestBody<Tfixtures>;
      opts = {} as TrequiredOpts;
    }

    if (isFunction(_updateCaseName)) {
      const result = _updateCaseName(testName as string);
      if (isString(result)) {
        testName = result;
      }
    }
    base.only(testName as string, async function () {
      try {
        await testBodyWrapper(testName, fn, opts)();
      } catch (error) {
        console.error(error);
        await sleep(waitingtime as number);
      }
    });
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
    opts: TtestOpts | TtestBody<Tfixtures>,
    fn?: TtestBody<Tfixtures>,
  ) {
    if (!isObject(opts)) {
      fn = opts as TtestBody<Tfixtures>;
      opts = {};
    }
    base.skip(`${skipReason} ${testName}`, testBodyWrapper(testName, fn, opts));
  };

  /**
   * @param {() => boolean} condition condition check
   * @param {string} testName test case title
   * @param {object|(fixtures?: any) => Promise<void> | any} opts test cases configuration options, or test case body
   * @param {(fixtures?: any) => Promise<void> | any} [fn] test case body
   * @returns {void}
   */
  test.if = function testIf(
    condition: TcheckTestCondition<TrequiredOpts>,
    testName,
    opts: TrequiredOpts | TtestBody<Tfixtures>,
    fn?: TtestBody<Tfixtures>,
  ) {
    if (!isObject(opts)) {
      fn = opts as TtestBody<Tfixtures>;
      opts = {} as TrequiredOpts;
    }

    if (condition(testName, opts as TrequiredOpts)) {
      test(testName, opts, fn);
    } else {
      base.skip(testName, testBodyWrapper(testName, fn, opts));
    }
  };

  function suiteBodyWrapper(suiteName, cb: TdescribeBody<Tfixtures>) {
    if (isFunction(_customSuiteHook)) {
      _customSuiteHook.call(this, this);
    }

    if (isFunction(_afterAllCases)) {
      base.afterAll(_afterAllCases);
    } else if (isAsyncFunction(_afterAllCases)) {
      base.afterAll(async function () {
        await _afterAllCases.call(this);
      });
    }

    if (isFunction(_beforeAllCases)) {
      base.beforeAll(_beforeAllCases);
    } else if (isAsyncFunction(_beforeAllCases)) {
      base.beforeAll(async function () {
        await _beforeAllCases.call(this);
      });
    }

    cb.call(this, fixtures);
  }

  function suite(suiteName: string, cb: TdescribeBody<Tfixtures>) {
    if (isFunction(_updateSuiteName)) {
      const updated = _updateSuiteName(suiteName);
      if (isString(updated)) {
        suiteName = updated;
      }
    }

    base.describe(suiteName, function () {
      if (isFunction(_suiteAdditionalCall)) {
        _suiteAdditionalCall(this);
      }
      suiteBodyWrapper.call(this, suiteName, cb);
    });
  }

  /**
   * @deprecated
   */
  suite.if = function suiteIf(condition: () => boolean, suiteName: string, cb: TdescribeBody<Tfixtures>) {
    if (condition()) {
      suite(suiteName, cb);
    } else {
      base.describe.skip(suiteName, function () {
        cb.call(this, fixtures);
      });
    }
  };

  suite.skip = function suiteSkip(suiteName, cb: TdescribeBody<Tfixtures>) {
    if (isFunction(_updateSuiteName)) {
      const updated = _updateSuiteName(suiteName);
      if (isString(updated)) {
        suiteName = updated;
      }
    }
    base.describe.skip(suiteName, function () {
      suiteBodyWrapper.call(this, suiteName, cb);
    });
  };

  suite.only = function suiteOnly(suiteName, cb: TdescribeBody<Tfixtures>) {
    if (isFunction(_updateSuiteName)) {
      const updated = _updateSuiteName(suiteName);
      if (isString(updated)) {
        suiteName = updated;
      }
    }
    // eslint-disable-next-line sonarjs/no-identical-functions
    base.describe.only(suiteName, function () {
      if (isFunction(_suiteAdditionalCall)) {
        _suiteAdditionalCall(this);
      }
      suiteBodyWrapper.call(this, suiteName, cb);
    });
  };

  function beforeEach(fn: TtestBody<Tfixtures>) {
    _beforeEachCase = async function () {
      await fn.call(this, fixtures);
    };

    return runner;
  }

  function afterEach(fn: TtestBody<Tfixtures>) {
    _afterEachCase = async function () {
      await fn.call(this, fixtures);
    };

    return runner;
  }

  function beforeAll(fn: TtestBody<Tfixtures>) {
    _beforeAllCases = async function () {
      await fn.call(this, fixtures);
    };

    return runner;
  }

  function afterAll(fn: TtestBody<Tfixtures>) {
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

  function checkTest(fn: (testTitle: string, testBodyStringified: string) => boolean | Promise<boolean>) {
    _customTestPreExecution = fn;
  }

  return runner;
}

function additionalSuiteCall(cb) {
  if (!isFunction(cb)) {
    throw new TypeError('additionalSuiteCall(): first argument should be a function');
  }
  _suiteAdditionalCall = cb;
}

function setGlobalIsRunnable(fn) {
  if (!isFunction(fn)) {
    throw new TypeError('setGlobalIsRunnable(): first argument should be a function');
  }
  _globalIsRunnable = fn;
}

export { getPreparedRunner, reportersManager, additionalSuiteCall, setGlobalIsRunnable };
