import { equal } from 'node:assert';
import { getMochaPreparedRunner } from '../../lib/test-runner/mocha';

const { test, suite, updateCaseName, updateSuiteName } = getMochaPreparedRunner({});

updateCaseName(() => '2');
updateSuiteName(() => '2');

suite('1', function () {
  equal(this.title, '2');
  test('1', function () {
    equal(this.test.title, '2');
  });
});
