import * as fs from 'fs';
import { sleep } from 'sat-utils';
import { allTestCasesPath, allTestCasesWithHistoryPath } from './constants';

import { getTestCaseHistory } from './api.calls';

async function fillTestCaseHistory() {
  if (!fs.existsSync(allTestCasesPath)) {
    throw new EvalError(`${allTestCasesPath} file does not exist, please run 'promod-system --fetch-testrail'`);
  }
  const testCases = require(allTestCasesPath);
  const withHistory = [];
  for (const testCase of testCases) {
    const history = await getTestCaseHistory(testCase.id);
    await sleep(150);
    testCase.history = history;
    withHistory.push(testCase);
  }

  require('fs').writeFileSync(allTestCasesWithHistoryPath, JSON.stringify(withHistory));
}

module.exports = {
  fillTestCaseHistory,
};
