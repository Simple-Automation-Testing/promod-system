import * as fs from 'fs';
import { getDirFilesList, lengthToIndexesArray } from 'sat-utils';
import { config } from '../config/config';

import {
  allTestCasesGroupedCreationByMonthPath,
  allTestCasesPath,
  allBugsGroupedCreationByMonthPath,
  allStoriesGroupedByTestingMonthPath,
  allStoriesGroupedByTestingMonthStoryPointsPath,
  allStoriesGroupedByTestingMonthStoryPointsPerQAPath,
  allTestCasesWithHistoryPath,
} from './constants';
import { getDateInterface } from './date';

const { testrailReport } = config.get();

function getAllAvailableCreatedBugs() {
  const bugs = [];
  try {
    const bugsFiles = getDirFilesList(testrailReport.outputDir).filter(filePath => filePath.endsWith('bugs.json'));
    for (const bugFile of bugsFiles) {
      const availableBugs = require(bugFile);
      bugs.push(...availableBugs);
    }
  } catch {
    /* */
  }

  return bugs;
}

function getAllAvailableTestedStories() {
  const stories = [];
  try {
    const storyFiles = getDirFilesList(testrailReport.outputDir).filter(filePath => filePath.endsWith('stories.json'));
    for (const bugFile of storyFiles) {
      const availableBugs = require(bugFile);
      stories.push(...availableBugs);
    }
  } catch {
    /* */
  }

  return stories;
}

function getBugsGroupedByMonth(starDate: string, periodInMonthes: number) {
  const bugs = getAllAvailableCreatedBugs();

  const data = {};

  let iteration = 1;

  const { getMonthRangeInUnixBy } = getDateInterface(starDate);
  while (iteration <= periodInMonthes) {
    const { startUnix, endUnix, id } = getMonthRangeInUnixBy(iteration++);

    const filteredByMonth = bugs
      .filter(({ created_on }) => created_on > startUnix && endUnix > created_on)
      .map(({ created_by, title }) => ({ created_by, title }));

    data[id] = filteredByMonth;
  }

  fs.writeFileSync(allBugsGroupedCreationByMonthPath, JSON.stringify(data));
}

/**
 * !@info this one should be executed fifth
 * @param {string} starDate
 * @param {number} periodInMonthes
 */
function getTestedStoriesGroupedByMonth(starDate: string, periodInMonthes: number) {
  const stories = getAllAvailableTestedStories();

  const data = {};

  let iteration = 1;

  const { getMonthRangeInUnixBy } = getDateInterface(starDate);
  while (iteration <= periodInMonthes) {
    const { startUnix, endUnix, id } = getMonthRangeInUnixBy(iteration++);

    const filteredByMonth = stories
      .filter(({ created_on }) => created_on > startUnix && endUnix > created_on)
      .map(({ created_by, title }) => ({ created_by, title }));

    data[id] = filteredByMonth;
  }

  fs.writeFileSync(allStoriesGroupedByTestingMonthPath, JSON.stringify(data));
}

/**
 * !@info this one should be executed seventh
 * @param {string} starDate
 * @param {number} periodInMonthes
 */
function getTestedStoriesGroupedByMonthInStoryPoints(starDate: string, periodInMonthes: number) {
  const stories = getAllAvailableTestedStories();

  const data = {};

  let iteration = 1;

  const { getMonthRangeInUnixBy } = getDateInterface(starDate);
  while (iteration <= periodInMonthes) {
    const { startUnix, endUnix, id } = getMonthRangeInUnixBy(iteration++);

    const filteredByMonth = stories
      .filter(({ created_on }) => created_on > startUnix && endUnix > created_on)
      .flatMap(({ created_by, title, story_points }) => {
        return story_points ? lengthToIndexesArray(story_points).map(() => ({ created_by, title })) : [];
      });

    data[id] = filteredByMonth;
  }

  fs.writeFileSync(allStoriesGroupedByTestingMonthStoryPointsPath, JSON.stringify(data));
}

/**
 * !@info this one should be executed first
 * @param {string} starDate
 * @param {number} periodInMonthes
 */
function getTestCaseGroupedByMonth(starDate: string, periodInMonthes: number) {
  if (!fs.existsSync(allTestCasesWithHistoryPath)) {
    throw new EvalError(
      `${allTestCasesWithHistoryPath} file does not exist, please run 'promod-system --fetch-testrail'`,
    );
  }
  const testCases = require(allTestCasesWithHistoryPath);

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

export {
  getTestCaseGroupedByMonth,
  getBugsGroupedByMonth,
  getTestedStoriesGroupedByMonth,
  getTestedStoriesGroupedByMonthInStoryPoints,
};
