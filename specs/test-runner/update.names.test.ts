import { equal } from 'node:assert';
import { getPreparedRunner } from '../../system/test-runner/mocha';

const { test, suite, updateCaseName, updateSuiteName } = getPreparedRunner();

updateCaseName(() => '2');
updateSuiteName(() => '2');

suite('1', function () {
  equal(this.title, '2');
  test('1', function () {
    equal(this.test.title, '2');
  });
});
