import { equal } from 'node:assert';
import { getPreparedRunner } from '../../lib/test-runner/mocha';

const { afterAll, test, beforeAll, afterEach, suite, beforeEach } = getPreparedRunner();

let suiteCall = 0;
let testCall = 0;
let beforeAllCall = 0;
let afterAllCall = 0;
let beforeEachCall = 0;
let afterEachCall = 0;

beforeAll(() => beforeAllCall++);
afterAll(() => equal(++afterAllCall, 1));
afterEach(() => afterEachCall++);
beforeEach(() => beforeEachCall++);

suite('example sync', function () {
  suiteCall++;

  test('first call', () => {
    testCall++;
  });

  test('second call', () => {
    testCall++;
  });

  test('third call', () => {
    testCall++;

    equal(testCall, 3), 'Three test calls should be done';
    equal(afterEachCall, 2), 'Three after each calls should be done';
    equal(beforeEachCall, 3), 'Three before each calls should be done';

    equal(suiteCall, 1, 'Only one suite call should be done');
    equal(beforeAllCall, 1, 'Only one before all call should be done');
    equal(afterAllCall, 0, 'Only one after all call should be done');
  });
});
