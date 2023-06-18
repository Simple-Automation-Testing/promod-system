/* eslint-disable sonarjs/cognitive-complexity */
import { isString } from 'sat-utils';
import * as fs from 'fs';
import { allTestCasesWithHistoryPath, allTestCasesGroupedUpdationByMonthPath } from './constants';
import { getDateInterface } from './date';
import { config } from '../config/config';

const { testrailReport } = config.get();

function createReportByMonthUpdates(starDate: string, periodInMonthes: number) {
  if (!fs.existsSync(allTestCasesWithHistoryPath)) {
    throw new EvalError(
      `${allTestCasesWithHistoryPath} file does not exist, please run 'promod-system --fetch-testrail-history'`,
    );
  }
  const testCases = require(allTestCasesWithHistoryPath);

  const data = {};
  let iteration = 1;

  const { getMonthRangeInUnixBy } = getDateInterface(starDate);

  while (iteration <= periodInMonthes) {
    const { startUnix, endUnix, id } = getMonthRangeInUnixBy(iteration++);

    const filteredByMonth = testCases.reduce((acc, { history: { history } }) => {
      const properChangesInCurrentMonth = history.filter(({ changes, created_on }) => {
        if (created_on > startUnix && created_on < endUnix) {
          if (changes) {
            return changes.some(
              change => testrailReport.countAsChanges.includes(change.field) && isString(change.old_value),
            );
          }

          return false;
        }

        return false;
      });

      if (properChangesInCurrentMonth.length) {
        properChangesInCurrentMonth.forEach(({ user_id }) => {
          acc.push({ created_by: user_id });
        });
      }

      return acc;
    }, []);

    data[id] = filteredByMonth;
  }

  fs.writeFileSync(allTestCasesGroupedUpdationByMonthPath, JSON.stringify(data));
}

export { createReportByMonthUpdates };
