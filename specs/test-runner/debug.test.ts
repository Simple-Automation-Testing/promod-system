import { equal } from 'node:assert';
import { getPreparedRunner } from '../../system/test-runner/mocha';

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
    throw new Error('This is a debug test');
  });

  test('second call', { a: 2 }, () => {
    throw new Error('This is a debug test');
  });

  test.debug(250, 'second call', () => {
    throw new Error('This is a debug test');
  });
});
