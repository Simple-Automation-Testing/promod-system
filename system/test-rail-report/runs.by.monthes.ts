import * as fs from 'fs';
import { allTestRunsGroupedByMonthesPath, allTestRunsWithDetailsPath } from './constants';
import { getDateInterface } from './date';

function getTestRunsGroupedByMonth(starDate: string, periodInMonthes: number) {
  if (!fs.existsSync(allTestRunsWithDetailsPath)) {
    throw new EvalError(
      `${allTestRunsWithDetailsPath} file does not exist, please run 'promod-system --fetch-testrail'`,
    );
  }
  const testRuns = require(allTestRunsWithDetailsPath);

  const data = {};

  let iteration = 1;

  const { getMonthRangeInUnixBy } = getDateInterface(starDate);

  while (iteration <= periodInMonthes) {
    const { startUnix, endUnix, id } = getMonthRangeInUnixBy(iteration++);

    const filteredByMonth = testRuns.filter(({ created_on }) => created_on > startUnix && endUnix > created_on);
    // https://support.gurock.com/hc/en-us/articles/7077935129364-Statuses#getstatuses
    const cases = filteredByMonth
      .flatMap(testRun => testRun.details)
      .filter(({ status_id }) => status_id !== 3)
      .map(({ created_by }) => ({ created_by }));

    data[id] = cases;
  }

  fs.writeFileSync(allTestRunsGroupedByMonthesPath, JSON.stringify(data));
}

export { getTestRunsGroupedByMonth };
