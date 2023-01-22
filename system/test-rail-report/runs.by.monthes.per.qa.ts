import * as fs from 'fs';
import { config } from '../config/config';
import { allTestRunsGroupedByMonthesPath, allTestRunsGroupedByMonthesPerQAPath } from './constants';

const { testrailReport } = config.get();

function createTestExecutionProductivityByQAPerMonth() {
  if (!fs.existsSync(allTestRunsGroupedByMonthesPath)) {
    throw new EvalError(
      `${allTestRunsGroupedByMonthesPath} file does not exist, please run 'promod-system --fetch-testrail-by-month-updates'`,
    );
  }
  const testCases = require(allTestRunsGroupedByMonthesPath);

  const perUser = Object.keys(testrailReport.users).reduce(
    (acc, userName) => {
      acc[userName] = {};

      return acc;
    },
    { 'Not part of the team anymore': {} },
  );

  function getUserById(id) {
    return (
      Object.keys(testrailReport.users).find(key => testrailReport.users[key] === id) || 'Not part of the team anymore'
    );
  }

  for (const month of Object.keys(testCases)) {
    const monthCases = testCases[month];
    for (const testCase of monthCases) {
      const user = getUserById(testCase.created_by);
      if (perUser[user][month]) {
        perUser[user][month]++;
      } else {
        perUser[user][month] = 1;
      }
    }
  }

  fs.writeFileSync(allTestRunsGroupedByMonthesPerQAPath, JSON.stringify(perUser));
}

export { createTestExecutionProductivityByQAPerMonth };
