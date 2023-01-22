import * as fs from 'fs';
import { sleep } from 'sat-utils';
import { allTestRunsPath, allTestRunsWithDetailsPath, allTestCasesPath } from './constants';

import { getAllTestCaseExecutionResult } from './api.calls';

async function fillTestrunDetails() {
  if (!fs.existsSync(allTestRunsPath)) {
    throw new EvalError(`${allTestRunsPath} file does not exist, please run 'promod-system --fetch-testrail'`);
  }

  const testCases = require(allTestCasesPath);
  const testRuns = require(allTestRunsPath);

  const withDetails = [];

  for (const testRun of testRuns) {
    const runId = testRun.id;
    const suiteId = testRun.suite_id;
    const casesFromSuite = testCases.filter(testCase => testCase.suite_id === suiteId);
    const testRunDetails = [];

    for (const testCase of casesFromSuite) {
      const testCaseExecutionResults = await getAllTestCaseExecutionResult(runId, testCase.id);
      testRunDetails.push(...testCaseExecutionResults);
    }

    testRun.details = testRunDetails;
    withDetails.push(testRun);

    await sleep(100);
  }

  fs.writeFileSync(allTestRunsWithDetailsPath, JSON.stringify(withDetails));
}

export { fillTestrunDetails };
