import * as fs from 'fs';
import { allTestCasesGroupedCreationByMonthPath, allTestCasesPath } from './constants';
import { getDateInterface } from './date';

function getTestCaseGroupedByMonth(starDate: string, periodInMonthes: number) {
  if (!fs.existsSync(allTestCasesPath)) {
    throw new EvalError(`${allTestCasesPath} file does not exist, please run 'promod-system --fetch-testrail'`);
  }
  const testCases = require(allTestCasesPath);

  const data = {};

  let iteration = 1;

  const { getMonthRangeInUnixBy } = getDateInterface(starDate);
  while (iteration <= periodInMonthes) {
    const { startUnix, endUnix, id } = getMonthRangeInUnixBy(iteration++);

    const filteredByMonth = testCases
      .filter(({ created_on }) => created_on > startUnix && endUnix > created_on)
      .map(({ created_by, title }) => ({ created_by, title }));

    data[id] = filteredByMonth;
  }

  fs.writeFileSync(allTestCasesGroupedCreationByMonthPath, JSON.stringify(data));
}

export { getTestCaseGroupedByMonth };
