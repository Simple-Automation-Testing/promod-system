import * as fs from 'fs';
import { config } from '../../config/config';

const { testrailReport } = config.get();

function getBaseAutomationTestCaseGroupedByMonthPerQA(source, resultPath) {
  if (!fs.existsSync(source)) {
    throw new EvalError(`${source} file does not exist, please run 'promod-system --fetch-testrail-by-month-updates'`);
  }

  const testChanges = require(source);

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

  fs.writeFileSync(resultPath, JSON.stringify(perUser));
}

export { getBaseAutomationTestCaseGroupedByMonthPerQA };
