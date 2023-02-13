/* eslint-disable sonarjs/no-identical-functions */
import * as fs from 'fs';
import { config } from '../config/config';
import {
  allTestCasesGroupedCreationByMonthPath,
  allTestCasesGroupedCreationByMonthPerQAPath,
  allBugsGroupedCreationByMonthPath,
  allBugsGroupedCreationByMonthPerQAPath,
  allStoriesGroupedByTestingMonthPath,
  allStoriesGroupedByTestingMonthPerQAPath,
  allStoriesGroupedByTestingMonthStoryPointsPath,
  allStoriesGroupedByTestingMonthStoryPointsPerQAPath,
} from './constants';

const { testrailReport } = config.get();

function getUserById(id) {
  return (
    Object.keys(testrailReport.users).find(key => testrailReport.users[key] === id) || 'Not part of the team anymore'
  );
}

function createBugsProductivityByQAPerMonth() {
  if (!fs.existsSync(allBugsGroupedCreationByMonthPath)) {
    throw new EvalError(`${allBugsGroupedCreationByMonthPath} file does not exist, please run 'promod-system --*'`);
  }
  const bugs = require(allBugsGroupedCreationByMonthPath);

  const perUser = Object.keys(testrailReport.users).reduce(
    (acc, userName) => {
      acc[userName] = {};

      return acc;
    },
    { 'Not part of the team anymore': {} },
  );

  for (const month of Object.keys(bugs)) {
    const monthCases = bugs[month];
    for (const testCase of monthCases) {
      const user = getUserById(testCase.created_by);
      if (perUser[user][month]) {
        perUser[user][month]++;
      } else {
        perUser[user][month] = 1;
      }
    }
  }

  fs.writeFileSync(allBugsGroupedCreationByMonthPerQAPath, JSON.stringify(perUser));
}

function createStoryTestingProductivityByQAPerMonth() {
  if (!fs.existsSync(allStoriesGroupedByTestingMonthPath)) {
    throw new EvalError(`${allStoriesGroupedByTestingMonthPath} file does not exist, please run 'promod-system --*'`);
  }
  const stories = require(allStoriesGroupedByTestingMonthPath);

  const perUser = Object.keys(testrailReport.users).reduce(
    (acc, userName) => {
      acc[userName] = {};

      return acc;
    },
    { 'Not part of the team anymore': {} },
  );

  for (const month of Object.keys(stories)) {
    const monthCases = stories[month];
    for (const testCase of monthCases) {
      const user = getUserById(testCase.created_by);
      if (perUser[user][month]) {
        perUser[user][month]++;
      } else {
        perUser[user][month] = 1;
      }
    }
  }

  fs.writeFileSync(allStoriesGroupedByTestingMonthPerQAPath, JSON.stringify(perUser));
}

function createStoryTestingProductivityByQAPerMonthInStoryPoints() {
  if (!fs.existsSync(allStoriesGroupedByTestingMonthStoryPointsPath)) {
    throw new EvalError(
      `${allStoriesGroupedByTestingMonthStoryPointsPath} file does not exist, please run 'promod-system --*'`,
    );
  }
  const stories = require(allStoriesGroupedByTestingMonthStoryPointsPath);

  const perUser = Object.keys(testrailReport.users).reduce(
    (acc, userName) => {
      acc[userName] = {};

      return acc;
    },
    { 'Not part of the team anymore': {} },
  );

  for (const month of Object.keys(stories)) {
    const monthCases = stories[month];
    for (const testCase of monthCases) {
      const user = getUserById(testCase.created_by);
      if (perUser[user][month]) {
        perUser[user][month]++;
      } else {
        perUser[user][month] = 1;
      }
    }
  }

  fs.writeFileSync(allStoriesGroupedByTestingMonthStoryPointsPerQAPath, JSON.stringify(perUser));
}

function createProductivityByQAPerMonth() {
  if (!fs.existsSync(allTestCasesGroupedCreationByMonthPath)) {
    throw new EvalError(
      `${allTestCasesGroupedCreationByMonthPath} file does not exist, please run 'promod-system --fetch-testrail-by-month-updates'`,
    );
  }
  const testCases = require(allTestCasesGroupedCreationByMonthPath);

  const perUser = Object.keys(testrailReport.users).reduce(
    (acc, userName) => {
      acc[userName] = {};

      return acc;
    },
    { 'Not part of the team anymore': {} },
  );

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

  fs.writeFileSync(allTestCasesGroupedCreationByMonthPerQAPath, JSON.stringify(perUser));
}

export {
  createProductivityByQAPerMonth,
  createBugsProductivityByQAPerMonth,
  createStoryTestingProductivityByQAPerMonth,
  createStoryTestingProductivityByQAPerMonthInStoryPoints,
};
