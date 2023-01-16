import * as fs from 'fs';
import { getDateInterface } from '../date';
import { allTestCasesWithHistoryPath } from '../constants';

// eslint-disable-next-line sonarjs/cognitive-complexity
function createReportByMonthAutomation(starDate: string, periodInMonthes: number, config, resultPath) {
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
    const { startUnix, endUnix, id } = getMonthRangeInUnixBy(iteration);

    const filteredByMonth = testCases.reduce((acc, { history: { history } }) => {
      // @ts-ignore
      const properChangesInCurrentMonth = history.filter(({ changes, created_on }) => {
        if (created_on >= startUnix && created_on <= endUnix) {
          if (changes) {
            return changes.some(change => {
              return (
                change.field === config.id &&
                change?.old_text?.trim() === config.from &&
                change?.new_text?.trim() === config.to
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

    iteration++;
  }

  fs.writeFileSync(resultPath, JSON.stringify(data));
}

export { createReportByMonthAutomation };
