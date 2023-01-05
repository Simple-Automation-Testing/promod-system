import { sleep } from 'sat-utils';
import { equal } from 'node:assert';
import { getPreparedRunner } from '../../system/test-runner/mocha';

const { afterAll, test, beforeAll, afterEach, suite, beforeEach } = getPreparedRunner();

let suiteCall = 0;
let testCall = 0;
let beforeAllCall = 0;
let afterAllCall = 0;
let beforeEachCall = 0;
let afterEachCall = 0;

beforeAll(async () => {
  await sleep(50);
  beforeAllCall++;
});
afterAll(async () => {
  await sleep(50);
  equal(++afterAllCall, 1);
});
afterEach(async () => {
  await sleep(50);
  afterEachCall++;
});

beforeEach(async () => {
  await sleep(50);
  beforeEachCall++;
});

suite('example async', function () {
  suiteCall++;

  test('first call', async () => {
    await sleep(50);
    testCall++;
  });

  test('second call', async () => {
    await sleep(50);
    testCall++;
  });

  test('third call', async () => {
    await sleep(50);
    testCall++;

    equal(testCall, 3), 'Three test calls should be done';
    equal(beforeEachCall, 3), 'Three before each calls should be done';
    equal(afterEachCall, 2), 'Three after each calls should be done';

    equal(suiteCall, 1, 'Only one suite call should be done');
    equal(beforeAllCall, 1, 'Only one before all call should be done');
    equal(afterAllCall, 0, 'Only one after all call should be done');
  });
});
