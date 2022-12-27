/* eslint-disable no-only-tests/no-only-tests */
import { isNotEmptyArray, toArray, isObject, isFunction, isAsyncFunction } from 'sat-utils';

type TtestOpts = {
  tags?: string | string[];
};

type TtestBody<T> = (fixtures?: T) => Promise<void> | any;
type TdescribeBody<T> = (fixtures?: T) => void;

/**
 * @returns {string[]}
 */
function getArgumentTags(): string[] {
  const tagsArgId = '--tags=';

  return (
    process.argv
      .slice(2)
      .find(arg => arg.includes(tagsArgId))
      ?.replace(tagsArgId, '')
      ?.split(',') || []
  );
}

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

const getPreparedRunner = function <T>(fixtures?: T) {
  let beforeEachCase;
  let afterEachCase;
  let afterAllCases;
  let beforeAllCases;

  const itCallbackDecorator = function (itName, fn) {
    return async function () {
      try {
        if (beforeEachCase) {
          await beforeEachCase.call(this, fixtures);
        }

        await fn(fixtures);
        if (afterEachCase) {
          await afterEachCase.call(this, fixtures);
        }
      } catch (error) {
        if (afterEachCase) {
          await afterEachCase.call(this);
        }

        throw error;
      }
    };
  };

  const test = function (itName, opts: TtestOpts | TtestBody<T>, fn?: TtestBody<T>) {
    if (!checkExecutionTags((opts as TtestOpts).tags)) {
      return;
    }

    if (!isObject(opts)) {
      fn = opts as TtestBody<T>;
    }

    global.it(itName, itCallbackDecorator(itName, fn));
  };

  test.only = function (itName, opts: TtestOpts | TtestBody<T>, fn?: TtestBody<T>) {
    if (!isObject(opts)) {
      fn = opts as TtestBody<T>;
    }
    global.it.only(itName, itCallbackDecorator(itName, fn));
  };

  test.skip = function (itName, opts: TtestOpts | TtestBody<T>, fn?: TtestBody<T>) {
    if (!isObject(opts)) {
      fn = opts as TtestBody<T>;
    }
    global.it.skip(itName, itCallbackDecorator(itName, fn));
  };

  test.if = function (condition, itName, opts: TtestOpts | TtestBody<T>, fn?: TtestBody<T>) {
    if (!isObject(opts)) {
      fn = opts as TtestBody<T>;
    }
    if (condition()) {
      global.it(itName, itCallbackDecorator(itName, fn));
    } else {
      global.it.skip(itName, itCallbackDecorator(itName, fn));
    }
  };

  const suite = function suite(suiteName, cb: TdescribeBody<T>) {
    global.describe(suiteName, function () {
      if (isFunction(afterAllCases)) {
        global.after(afterAllCases);
      }

      if (isAsyncFunction(afterAllCases)) {
        global.after(async function () {
          await afterAllCases.call(this);
        });
      }

      if (isFunction(beforeAllCases)) {
        global.before(afterAllCases);
      }

      if (isAsyncFunction(afterAllCases)) {
        global.after(async function () {
          await afterAllCases.call(this);
        });
      }

      if (isAsyncFunction(beforeAllCases)) {
        global.after(async function () {
          await afterAllCases.call(this);
        });
      }

      cb.call(this, fixtures);
    });
  };

  suite.if = function suiteIf(condition, itName, cb: TdescribeBody<T>) {
    if (condition()) {
      global.describe(itName, function () {
        cb.call(this, fixtures);
      });
    } else {
      global.describe.skip(itName, function () {
        cb.call(this, fixtures);
      });
    }
  };

  suite.skip = function suiteSkip(suiteName, cb: TdescribeBody<T>) {
    global.describe.skip(suiteName, function () {
      cb();
    });
  };

  suite.only = function suiteOnly(suiteName, cb: TdescribeBody<T>) {
    global.describe.only(suiteName, function () {
      cb();
    });
  };

  const beforeEach = function (fn: TtestBody<T>) {
    beforeEachCase = async function () {
      await fn.call(this, fixtures);
    };
  };

  const afterEach = function (fn: TtestBody<T>) {
    afterEachCase = async function () {
      await fn.call(this, fixtures);
    };
  };

  const beforeAll = function (fn: TtestBody<T>) {
    afterAllCases = async function () {
      await fn.call(this, fixtures);
    };
  };

  const afterAll = function (fn: TtestBody<T>) {
    beforeAllCases = async function () {
      await fn.call(this, fixtures);
    };
  };

  return {
    suite,
    test,
    beforeEach,
    afterEach,
    beforeAll,
    afterAll,
  };
};

export { getPreparedRunner };
