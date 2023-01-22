/* eslint-disable no-console, sonarjs/no-identical-functions */
import * as fs from 'fs';
import { lengthToIndexesArray } from 'sat-utils';
import {
  allTestCasesPath,
  allTestCasesGroupedCreationByMonthPath,
  allTestCasesGroupedCreationPerQAByMonthPathQAPath,
  allTestCasesGroupedUpdationByMonthPath,
  allTestCasesGroupedUpdationPerQAByMonthPath,
  allTestCasesGroupedCreationAutomationByMonthPath,
  allTestCasesGroupedCreationAutomationPerQAByMonthPath,
  allTestCasesGroupedUpdationAutomationByMonthPath,
  allTestCasesGroupedUpdationAutomationPerQAByMonthPath,
  allTestRunsWithDetailsPath,
  allTestRunsGroupedByMonthesPath,
  allTestRunsGroupedByMonthesPerQAPath,
} from './constants';

function getSeparator() {
  return lengthToIndexesArray(40)
    .map(() => '-')
    .join('');
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

  if (fs.existsSync(allTestCasesGroupedCreationByMonthPath)) {
    report += parseByMonth(allTestCasesGroupedCreationByMonthPath, 'Grouped by month creation', 'new cases');
  }
  if (fs.existsSync(allTestCasesGroupedCreationPerQAByMonthPathQAPath)) {
    report += parseByMonthPerQA(allTestRunsGroupedByMonthesPath, 'Grouped by month creation per QA');
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

export { parseReportToConsoleOutput };
