import * as fs from 'fs';
import * as path from 'path';
import * as dayjs from 'dayjs';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import { sleep, getDirFilesList } from 'sat-utils';
import { allTestCasesPath, allTestCasesWithHistoryPath } from './constants';

import { config } from '../config/config';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const {
  testrailReport = {
    outputDir: path.resolve(process.cwd(), './.testraildata'),
  },
} = config.get();

import { getTestCaseHistory } from './api.calls';

function getTestCasesHistoryFromCache(currentTestCasesWithHistory) {
  const unqiCacheDetails = [];

  if (testrailReport.outputDir) {
    const filePattern = /cache.\d{2}-\d{2}-\d{4}.all.testcases.with.history.json/gm;

    const testCasesWithHistoryCache = getDirFilesList(testrailReport.outputDir).filter(filePath => {
      return filePath.match(filePattern);
    });

    testCasesWithHistoryCache.sort((fistFile, secondFile) => {
      const pattern = /\d{2}-\d{2}-\d{4}/gm;

      const [firstFileDate] = fistFile.match(pattern);
      const [secondFileDate] = secondFile.match(pattern);

      if (dayjs(firstFileDate, 'MM-DD-YYYY').isBefore(dayjs(secondFileDate, 'MM-DD-YYYY'))) return 1;
      if (dayjs(firstFileDate, 'MM-DD-YYYY').isAfter(dayjs(secondFileDate, 'MM-DD-YYYY'))) return -1;
      return 0;
    });

    // first is latest one
    testCasesWithHistoryCache.forEach(cacheFilePath => {
      const data = require(cacheFilePath);
      const onlyUniqTestCases = data.filter(
        cacheTestCase => !currentTestCasesWithHistory.some(testCase => testCase.id === cacheTestCase.id),
      );

      unqiCacheDetails.push(...onlyUniqTestCases);
    });
  }

  return unqiCacheDetails;
}

async function fillTestCaseHistory() {
  if (!fs.existsSync(allTestCasesPath)) {
    throw new EvalError(`${allTestCasesPath} file does not exist, please run 'promod-system --fetch-testrail'`);
  }

  const testCases = require(allTestCasesPath);

  const withHistory = [];

  for (const testCase of testCases) {
    const history = await getTestCaseHistory(testCase.id);
    await sleep(100);
    testCase.history = history;
    withHistory.push(testCase);
  }

  const unqiCache = getTestCasesHistoryFromCache(withHistory);

  withHistory.push(...unqiCache);

  if (fs.existsSync(allTestCasesWithHistoryPath)) {
    const data = require(allTestCasesWithHistoryPath);
    const cacheFilePath = path.parse(allTestCasesWithHistoryPath).dir;
    const cacheFileName = `cache.${dayjs().format('MM-DD-YYYY')}.${path.parse(allTestCasesWithHistoryPath).base}`;

    fs.writeFileSync(`${cacheFilePath}/${cacheFileName}`, JSON.stringify(data));
  }

  fs.writeFileSync(allTestCasesWithHistoryPath, JSON.stringify(withHistory));
}

export { fillTestCaseHistory, getTestCasesHistoryFromCache };
