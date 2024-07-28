/* eslint-disable no-console */
import { equal } from 'node:assert';
import { getPreparedRunner } from '../../lib/test-runner/mocha';

const { afterAll, test, suite, addReporters, customSuiteHook } = getPreparedRunner();

let titleByClass;
let titleByObj;

class ReporterExample {
  data: any[];

  constructor() {
    this.data = [];
  }

  startCase(testCaseTitle: string) {}

  addStep(stepData: string) {}

  addCaseProperties(opts) {}

  addCustomData(...args: any[]) {}

  finishSuccessCase(testCaseTitle: string) {
    titleByClass = testCaseTitle;
  }

  finishFailedCase(testCaseTitle: string, error: Error) {}
}

const reporterObj = {
  startCase(testCaseTitle: string) {},

  addStep(stepData: string) {},

  addCaseProperties(opts) {},

  addCustomData(...args: any[]) {},

  finishSuccessCase(testCaseTitle: string) {
    console.log(testCaseTitle);

    titleByObj = testCaseTitle;
  },
  finishFailedCase(testCaseTitle: string, error: Error) {},
};

addReporters(() => new ReporterExample());
addReporters(() => reporterObj);

customSuiteHook(a => a);

afterAll(() => {
  equal('2', titleByClass);
  equal('2', titleByObj);
});

suite('2', function () {
  test('2', function () {});
});
