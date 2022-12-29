import { equal } from 'node:assert';
import { getPreparedRunner } from '../../system/test-runner/mocha';

const { afterAll, test, suite, addReporters } = getPreparedRunner();

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

  finishFailedCase(testCaseTitle: string, error: Error) {}
}

const reporterObj = {
  startCase(testCaseTitle: string) {},

  addStep(stepData: string) {},

  addCustomData(...args: any[]) {},

  finishSuccessCase(testCaseTitle: string) {
    titleByObj = testCaseTitle;
  },
  finishFailedCase(testCaseTitle: string, error: Error) {},
};

addReporters(() => new ReporterExample());
addReporters(() => reporterObj);

afterAll(() => {
  equal('1', titleByClass);
  equal('1', titleByObj);
});

suite.only('1', function () {
  test('1', function () {});
});
