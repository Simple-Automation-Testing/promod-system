import * as fs from 'fs';
import { allTestCasesWithHistoryPath, allTestCasesGroupedUpdationAutomationByMonthPath } from './constants';
import { getDateInterface } from './date';
import { config } from '../config/config';

const { testrailReport } = config.get();

// eslint-disable-next-line sonarjs/cognitive-complexity
function createReportByMonthAutomationUpdates(starDate: string, periodInMonthes: number) {
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
    const { startUnix, endUnix, id } = getMonthRangeInUnixBy(starDate);

    const filteredByMonth = testCases.reduce((acc, { history: { history } }) => {
      // @ts-ignore
      const properChangesInCurrentMonth = history.filter(({ changes, created_on }) => {
        if (created_on >= startUnix && created_on <= endUnix) {
          if (changes) {
            return changes.some(change => {
              return (
                change.field === testrailReport.automationId &&
                change?.old_text?.trim() === testrailReport.from &&
                change?.new_text?.trim() === testrailReport.to
              );
            });
          }

          return false;
        }

        return false;
      });

      if (properChangesInCurrentMonth.length) {
        properChangesInCurrentMonth.forEach(({ user_id }) => {
          // @ts-ignore
          acc.push({ created_by: user_id });
        });
      }

      return acc;
    }, []);

    data[id] = filteredByMonth;
  }

  fs.writeFileSync(allTestCasesGroupedUpdationAutomationByMonthPath, JSON.stringify(data));
}

export { createReportByMonthAutomationUpdates };
