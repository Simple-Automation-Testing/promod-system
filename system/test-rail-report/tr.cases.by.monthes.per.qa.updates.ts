import * as fs from 'fs';
import { allTestCasesGroupedUpdationByMonthPath, allTestCasesGroupedUpdationPerQAByMonthPath } from './constants';
import { config } from '../config/config';

const { testrailReport } = config.get();

function getUpdatedTestCaseGroupedByMonthPerQA() {
  if (!fs.existsSync(allTestCasesGroupedUpdationByMonthPath)) {
    throw new EvalError(
      `${allTestCasesGroupedUpdationByMonthPath} file does not exist, please run 'promod-system --fetch-testrail-by-month-updates'`,
    );
  }
  const testChanges = require(allTestCasesGroupedUpdationByMonthPath);

  const perUser = Object.keys(testrailReport.users).reduce(
    (acc, userName) => {
      acc[userName] = {};

      return acc;
    },
    { 'Not part of the team anymore': {} },
  );

  function getUserById(id) {
    return Object.keys(testrailReport.users).find(key => testrailReport.users[key] === id);
  }

  for (const month of Object.keys(testChanges)) {
    const monthChanges = testChanges[month];
    for (const testChange of monthChanges) {
      const user = getUserById(testChange.created_by) || 'Not part of the team anymore';
      if (perUser[user][month]) {
        perUser[user][month]++;
      } else {
        perUser[user][month] = 1;
      }
    }
  }

  fs.writeFileSync(allTestCasesGroupedUpdationPerQAByMonthPath, JSON.stringify(perUser));
}

export { getUpdatedTestCaseGroupedByMonthPerQA };
