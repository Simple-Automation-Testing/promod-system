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

  addCustomData(...args: any[]) {}

  finishSuccessCase(testCaseTitle: string) {
    titleByClass = testCaseTitle;
  }
  addCaseProperties(opts) {}

  finishFailedCase(testCaseTitle: string, error: Error) {}
}

const reporterObj = {
  startCase(testCaseTitle: string) {},

  addStep(stepData: string) {},

  addCustomData(...args: any[]) {},

  finishSuccessCase(testCaseTitle: string) {
    titleByObj = testCaseTitle;
  },
  addCaseProperties(opts) {},
  finishFailedCase(testCaseTitle: string, error: Error) {},
};

addReporters(() => new ReporterExample());
addReporters(() => reporterObj);

customSuiteHook(a => a);

afterAll(() => {
  equal('1', titleByClass);
  equal('1', titleByObj);
});

suite('1', function () {
  test('1', function () {});
});
