/* eslint-disable no-console, sonarjs/no-identical-functions */
import * as fs from 'fs';
import * as path from 'path';
import { lengthToIndexesArray, getDirFilesList } from 'sat-utils';
import { config } from '../config/config';
import {
  allTestCasesPath,
  allTestCasesGroupedCreationByMonthPath,
  allTestCasesGroupedCreationByMonthPerQAPath,
  allTestCasesGroupedUpdationByMonthPath,
  allTestCasesGroupedUpdationPerQAByMonthPath,
  allTestCasesGroupedCreationAutomationByMonthPath,
  allTestCasesGroupedCreationAutomationPerQAByMonthPath,
  allTestCasesGroupedUpdationAutomationByMonthPath,
  allTestCasesGroupedUpdationAutomationPerQAByMonthPath,
  allTestRunsWithDetailsPath,
  allTestRunsGroupedByMonthesPath,
  allTestRunsGroupedByMonthesPerQAPath,
  allBugsGroupedCreationByMonthPerQAPath,
  allStoriesGroupedByTestingMonthPath,
  allStoriesGroupedByTestingMonthPerQAPath,
} from './constants';
import { sortMonthes } from './date';

const { testrailReport } = config.get();

import { createExecutionReport, extendGeneralReport } from './report.templates';

function getSeparator() {
  return lengthToIndexesArray(40)
    .map(() => '-')
    .join('');
}

function getAllAvailableCreatedBugs() {
  const bugsFiles = getDirFilesList(testrailReport.outputDir).filter(filePath => filePath.endsWith('bugs.json'));
  const bugs = [];
  for (const bugFile of bugsFiles) {
    const availableBugs = require(bugFile);
    bugs.push(...availableBugs);
  }

  return bugs;
}

function transformBugsToMonthPerQAFormat() {
  const allBugs = getAllAvailableCreatedBugs();
}

function parseByMonth(pathToFile: string, title: string, description: string) {
  const monthesBasedData = require(pathToFile);

  const creationByMonthes = Object.keys(monthesBasedData).reduce((monthCreationReportPeach, month) => {
    const monthCases = monthesBasedData[month];
    monthCreationReportPeach += `\n${month} - ${description} ${monthCases.length}`;

    return monthCreationReportPeach;
  }, '');

  return `\n${title}.\n${creationByMonthes}\n${getSeparator()}`;
}

function parseByMonthPerQA(pathToFile: string, title: string) {
  const byMonthPerQA = require(pathToFile);

  const byMonthesPerQA = Object.keys(byMonthPerQA).reduce((monthPerQAReportPart, QA) => {
    const monthCases = byMonthPerQA[QA];

    const perQAPerf = Object.keys(monthCases).reduce((monthReportPart: string, month) => {
      monthReportPart += `\n\t${month} ${monthCases[month]}`;

      return monthReportPart;
    }, '');

    monthPerQAReportPart += `\n${QA} ${perQAPerf}`;

    return monthPerQAReportPart;
  }, '');

  return `\n${title}.\n${byMonthesPerQA}\n${getSeparator()}`;
}

function parseReportToConsoleOutput() {
  let report = '';

  if (fs.existsSync(allTestCasesPath)) {
    const allCasesData = require(allTestCasesPath);
    report += `\nAll test cases count in testrail is ${allCasesData.length}\n${getSeparator()}`;
  }

  if (fs.existsSync(allTestRunsWithDetailsPath)) {
    const allTestRuns = require(allTestRunsWithDetailsPath);
    report += `\nAll test runs count in testrail is ${allTestRuns.length}\n${getSeparator()}`;
  }

  if (fs.existsSync(allTestRunsGroupedByMonthesPath)) {
    report += parseByMonth(allTestRunsGroupedByMonthesPath, 'Grouped by testrun execution', 'executed cases');
  }
  if (fs.existsSync(allTestRunsGroupedByMonthesPerQAPath)) {
    report += parseByMonthPerQA(allTestRunsGroupedByMonthesPerQAPath, 'Grouped by testrun execution per QA');
  }

  return console.log(report);

  if (fs.existsSync(allTestCasesGroupedCreationByMonthPath)) {
    report += parseByMonth(allTestCasesGroupedCreationByMonthPath, 'Grouped by month creation', 'new cases');
  }
  if (fs.existsSync(allTestCasesGroupedCreationByMonthPerQAPath)) {
    report += parseByMonthPerQA(allTestCasesGroupedCreationByMonthPerQAPath, 'Grouped by month creation per QA');
  }

  if (fs.existsSync(allTestCasesGroupedUpdationByMonthPath)) {
    report += parseByMonth(allTestCasesGroupedCreationByMonthPath, 'Grouped by month updation', 'updated cases');
  }
  if (fs.existsSync(allTestCasesGroupedUpdationPerQAByMonthPath)) {
    report += parseByMonthPerQA(allTestCasesGroupedUpdationPerQAByMonthPath, 'Grouped by month updation per QA');
  }
  if (fs.existsSync(allTestCasesGroupedCreationAutomationByMonthPath)) {
    report += parseByMonth(
      allTestCasesGroupedCreationByMonthPath,
      'Grouped by month automation',
      'created automated cases',
    );
  }
  if (fs.existsSync(allTestCasesGroupedCreationAutomationPerQAByMonthPath)) {
    report += parseByMonthPerQA(
      allTestCasesGroupedCreationAutomationPerQAByMonthPath,
      'Grouped by month automation per QA',
    );
  }
  if (fs.existsSync(allTestCasesGroupedUpdationAutomationByMonthPath)) {
    report += parseByMonth(
      allTestCasesGroupedUpdationAutomationByMonthPath,
      'Grouped by month automation update',
      'updated automated cases',
    );
  }
  if (fs.existsSync(allTestCasesGroupedUpdationAutomationPerQAByMonthPath)) {
    report += parseByMonthPerQA(
      allTestCasesGroupedUpdationAutomationPerQAByMonthPath,
      'Grouped by month automation update per QA',
    );
  }

  console.log(report);
}

function parseTestRunExecutionToHTML() {
  if (fs.existsSync(allTestRunsGroupedByMonthesPerQAPath) && fs.existsSync(allTestRunsGroupedByMonthesPath)) {
    const perQAData = require(allTestRunsGroupedByMonthesPerQAPath);
    const monthData = require(allTestRunsGroupedByMonthesPath);

    const monthesAmount = Object.keys(monthData).length;

    const monthDataAligned = Object.keys(monthData).reduce((data, key) => {
      data[key] = monthData[key].length;

      return data;
    }, {});

    perQAData['Total executed'] = monthDataAligned;

    const labels = Object.keys(monthData);

    createExecutionReport(`${monthesAmount}_month`, labels, perQAData);
  }
}

function parseBurndownToHTML() {
  if (
    fs.existsSync(allTestCasesGroupedCreationByMonthPath) &&
    fs.existsSync(allTestCasesGroupedCreationAutomationByMonthPath)
  ) {
    const createdCasesData = require(allTestCasesGroupedCreationByMonthPath);
    const createdAutomationCasesData = require(allTestCasesGroupedCreationAutomationByMonthPath);

    const monthesAmount = Object.keys(createdCasesData).length;
    const monthes = sortMonthes(Object.keys(createdCasesData));

    const manualProgress = monthes.reduce((data, key, index, context) => {
      if (index === 0) {
        data[key] = createdCasesData[key].length;
      } else {
        const prevMonth = data[context[index - 1]];
        data[key] = prevMonth + createdCasesData[key].length;
      }

      return data;
    }, {});

    const automationProgress = monthes.reduce((data, key, index, context) => {
      if (index === 0) {
        data[key] = createdAutomationCasesData[key].length;
      } else {
        const prevMonth = data[context[index - 1]];
        data[key] = prevMonth + createdAutomationCasesData[key].length;
      }

      return data;
    }, {});

    const monthBurnDownChart = {
      'New manual test cases': manualProgress,
      'New automation test cases': automationProgress,
    };

    createExecutionReport(`${monthesAmount}_month_burndown`, monthes, monthBurnDownChart);
  }
}

type TreportType = {
  reportId: string;
  dataDescriptors: string[];
  dataSet: { [k: string]: { [k: string]: number } };
};

function parseGeneralReport() {
  const reportExtensions: TreportType[] = [];

  if (
    fs.existsSync(allTestCasesGroupedCreationByMonthPath) &&
    fs.existsSync(allTestCasesGroupedCreationAutomationByMonthPath)
  ) {
    const createdCasesData = require(allTestCasesGroupedCreationByMonthPath);
    const createdAutomationCasesData = require(allTestCasesGroupedCreationAutomationByMonthPath);

    const dataDescriptors = sortMonthes(Object.keys(createdCasesData));

    const manualProgress = dataDescriptors.reduce((data, key, index, context) => {
      if (index === 0) {
        data[key] = createdCasesData[key].length;
      } else {
        const prevMonth = data[context[index - 1]];
        data[key] = prevMonth + createdCasesData[key].length;
      }

      return data;
    }, {});

    const automationProgress = dataDescriptors.reduce((data, key, index, context) => {
      if (index === 0) {
        data[key] = createdAutomationCasesData[key].length;
      } else {
        const prevMonth = data[context[index - 1]];
        data[key] = prevMonth + createdAutomationCasesData[key].length;
      }

      return data;
    }, {});

    const dataSet = {
      'New manual test cases': manualProgress,
      'New automation test cases': automationProgress,
    };

    const testsBurndown: TreportType = { reportId: 'burndown', dataDescriptors, dataSet };

    reportExtensions.push(testsBurndown);
  }

  if (fs.existsSync(allTestRunsGroupedByMonthesPerQAPath) && fs.existsSync(allTestRunsGroupedByMonthesPath)) {
    const dataSet = require(allTestRunsGroupedByMonthesPerQAPath);
    const monthData = require(allTestRunsGroupedByMonthesPath);

    if (fs.existsSync(allBugsGroupedCreationByMonthPerQAPath)) {
      const createdBugs = require(allBugsGroupedCreationByMonthPerQAPath);
      Object.assign(
        dataSet,
        Object.keys(createdBugs).reduce((bugsPerQA, key) => {
          bugsPerQA[`${key} new bugs`] = createdBugs[key];

          return bugsPerQA;
        }, {}),
      );
    }

    const monthDataAligned = Object.keys(monthData).reduce((data, key) => {
      data[key] = monthData[key].length;

      return data;
    }, {});

    dataSet['Total executed'] = monthDataAligned;

    const dataDescriptors = sortMonthes(Object.keys(monthData));

    const testRunExecutions: TreportType = { reportId: 'execution', dataDescriptors, dataSet };

    reportExtensions.push(testRunExecutions);
  }

  if (fs.existsSync(allStoriesGroupedByTestingMonthPath) && fs.existsSync(allStoriesGroupedByTestingMonthPerQAPath)) {
    const dataSet = require(allStoriesGroupedByTestingMonthPerQAPath);
    const monthData = require(allStoriesGroupedByTestingMonthPath);

    const monthDataAligned = Object.keys(monthData).reduce((data, key) => {
      data[key] = monthData[key].length;

      return data;
    }, {});

    dataSet['Total stories'] = monthDataAligned;

    const dataDescriptors = sortMonthes(Object.keys(monthData));

    const testRunExecutions: TreportType = { reportId: 'story_testing', dataDescriptors, dataSet };

    reportExtensions.push(testRunExecutions);
  }
  reportExtensions.forEach(data => extendGeneralReport(data));
}

export { parseReportToConsoleOutput, parseTestRunExecutionToHTML, parseBurndownToHTML, parseGeneralReport };
