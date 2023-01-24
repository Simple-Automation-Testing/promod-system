/* eslint-disable no-console */
import * as fs from 'fs';
import { resolve, basename } from 'path';
import { getDirFilesList, shuffleArr, isUndefined } from 'sat-utils';
import { testRunsWithDetailsPath, allTestRunsPath, allTestCasesPath, allTestRunsWithDetailsPath } from './constants';

import { config } from '../config/config';

const {
  testrailReport = {
    outputDir: resolve(process.cwd(), './.testraildata'),
  },
} = config.get();

import { getAllTestCaseExecutionResult } from './api.calls';

function getTestRunsFiles() {
  if (fs.existsSync(testrailReport.outputDir)) {
    return getDirFilesList(testrailReport.outputDir).filter(
      item => basename(item).includes('testruns.details') && !basename(item).includes('all.testruns.details'),
    );
  }

  return [];
}

function findWithoutDetails() {
  const files = getTestRunsFiles();

  for (const file of files) {
    const data = require(file);
    if (isUndefined(data.details)) {
      console.error(file);
    }
  }
}

function mergeTestRuns() {
  const files = getTestRunsFiles();

  const allTestRunsDetails = [];
  for (const file of files) {
    allTestRunsDetails.push(require(file));
  }

  fs.writeFileSync(allTestRunsWithDetailsPath, JSON.stringify(allTestRunsDetails));
}

function getAlreadyStoredRunsIds() {
  return getTestRunsFiles().map(item => +basename(item).match(/\d+/gim)[0]);
}

async function fillTestrunDetails() {
  if (!fs.existsSync(allTestRunsPath)) {
    throw new EvalError(`${allTestRunsPath} file does not exist, please run 'promod-system --fetch-testrail'`);
  }

  const testCases = require(allTestCasesPath);
  const testRuns = require(allTestRunsPath);

  let testRunsToPerform: any[] = shuffleArr(
    testRuns.filter(testRun => !getAlreadyStoredRunsIds().includes(testRun.id)),
  );

  while (testRunsToPerform.length) {
    const [testRun] = testRunsToPerform.splice(0, 1);

    const runId = testRun.id;
    const suiteId = testRun.suite_id;
    // create placeholder for parallel workers
    fs.writeFileSync(testRunsWithDetailsPath(runId), JSON.stringify(testRun));

    const casesFromSuite = testCases.filter(
      testCase => testCase.created_on <= testRun.created_on && testCase.suite_id === suiteId,
    );
    const testRunDetails = [];

    for (const testCase of casesFromSuite) {
      const testCaseExecutionResults = await getAllTestCaseExecutionResult(runId, testCase.id);
      testRunDetails.push(...testCaseExecutionResults);
    }

    testRun.details = testRunDetails;

    fs.writeFileSync(testRunsWithDetailsPath(runId), JSON.stringify(testRun));

    testRunsToPerform = shuffleArr(testRuns.filter(testRun => !getAlreadyStoredRunsIds().includes(testRun.id)));
  }
}

export { fillTestrunDetails, mergeTestRuns, findWithoutDetails };
