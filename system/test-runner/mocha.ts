/* eslint-disable no-only-tests/no-only-tests, sonarjs/cognitive-complexity */
import { isString, isNotEmptyArray, toArray, isObject, isFunction, isAsyncFunction } from 'sat-utils';
import { reportersManager } from '../reporter';
import { getArgumentTags, shouldRecallAfterEach } from './setup';

import type { TreporterInstance } from '../reporter';

type TtestOpts = {
  tags?: string | string[];
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
  let _updateSuiteName: (suiteTitle: string) => string;
  let _updateCaseName: (caseName: string) => string;

  function testBodyWrapper(itName, fn) {
    return async function () {
      try {
        if (isFunction(_customTestPreExecution) || isAsyncFunction(_customTestPreExecution)) {
          const result = await _customTestPreExecution();
          if (!result) {
            return;
          }
        }

        reportersCreators.forEach(r => reportersManager.addReporter(r()));
        reportersManager.startCase(itName);

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

        reportersManager.finishSuccessCase(itName);
        reportersManager.reset();
      } catch (error) {
        reportersManager.finishFailedCase(itName, error);
        reportersManager.reset();

        if (shouldRecallAfterEach() && _afterEachCase) {
          await _afterEachCase.call(this);
        }

        throw error;
      }
    };
  }

  function test(itName, opts: TtestOpts | TtestBody<T>, fn?: TtestBody<T>) {
    if (!checkExecutionTags((opts as TtestOpts).tags)) {
      return;
    }

    if (!isObject(opts)) {
      fn = opts as TtestBody<T>;
    }

    global.it(itName, testBodyWrapper(itName, fn));
  }

  test.only = function (itName, opts: TtestOpts | TtestBody<T>, fn?: TtestBody<T>) {
    if (!isObject(opts)) {
      fn = opts as TtestBody<T>;
    }
    global.it.only(itName, testBodyWrapper(itName, fn));
  };

  test.skip = function (itName, opts: TtestOpts | TtestBody<T>, fn?: TtestBody<T>) {
    if (!isObject(opts)) {
      fn = opts as TtestBody<T>;
    }
    global.it.skip(itName, testBodyWrapper(itName, fn));
  };

  test.if = function (condition, itName, opts: TtestOpts | TtestBody<T>, fn?: TtestBody<T>) {
    if (!isObject(opts)) {
      fn = opts as TtestBody<T>;
    }
    if (condition()) {
      global.it(itName, testBodyWrapper(itName, fn));
    } else {
      global.it.skip(itName, testBodyWrapper(itName, fn));
    }
  };

  function suite(suiteName, cb: TdescribeBody<T>) {
    if (isFunction(_updateSuiteName)) {
      const updated = _updateSuiteName(suiteName);
      if (isString(updated)) {
        suiteName = updated;
      }
    }

    global.describe(suiteName, function () {
      if (isFunction(_afterAllCases)) {
        global.after(_afterAllCases);
      }

      if (isAsyncFunction(_afterAllCases)) {
        global.after(async function () {
          await _afterAllCases.call(this);
        });
      }

      if (isFunction(_beforeAllCases)) {
        global.before(_afterAllCases);
      }

      if (isAsyncFunction(_afterAllCases)) {
        global.after(async function () {
          await _afterAllCases.call(this);
        });
      }

      if (isAsyncFunction(_beforeAllCases)) {
        global.after(async function () {
          await _afterAllCases.call(this);
        });
      }

      cb.call(this, fixtures);
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
    global.describe.skip(suiteName, function () {
      cb.call(this, fixtures);
    });
  };

  suite.only = function suiteOnly(suiteName, cb: TdescribeBody<T>) {
    global.describe.only(suiteName, function () {
      cb.call(this, fixtures);
    });
  };

  function beforeEach(fn: TtestBody<T>) {
    _beforeEachCase = async function () {
      await fn.call(this, fixtures);
    };
  }

  function afterEach(fn: TtestBody<T>) {
    _afterEachCase = async function () {
      await fn.call(this, fixtures);
    };
  }

  function beforeAll(fn: TtestBody<T>) {
    _afterAllCases = async function () {
      await fn.call(this, fixtures);
    };
  }

  function afterAll(fn: TtestBody<T>) {
    _beforeAllCases = async function () {
      await fn.call(this, fixtures);
    };
  }

  function updateSuiteName(fn: (suiteTitle: string) => string) {
    _updateSuiteName = fn;
  }

  function updateCaseName(fn: (caseTitle: string) => string) {
    _updateCaseName = fn;
  }

  return {
    suite,
    test,
    beforeEach,
    afterEach,
    beforeAll,
    afterAll,
    updateSuiteName,
    updateCaseName,
  };
}

getPreparedRunner.addReporters = function (createReporter: () => TreporterInstance | (() => TreporterInstance)[]) {
  // @ts-ignore
  reportersCreators.push(...toArray(createReporter));
};

export { getPreparedRunner };
