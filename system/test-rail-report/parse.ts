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
} from './constants';

function getSeparator() {
  return lengthToIndexesArray(40)
    .map(() => '-')
    .join('');
}

function parseReportToConsoleOutput() {
  let report = '';
  if (fs.existsSync(allTestCasesPath)) {
    const allCasesData = require(allTestCasesPath);
    report += `\nAll test cases count in testrail is ${allCasesData.length}\n${getSeparator()}`;
  }
  if (fs.existsSync(allTestCasesGroupedCreationByMonthPath)) {
    const monthesBasedData = require(allTestCasesGroupedCreationByMonthPath);
    const creationByMonthes = Object.keys(monthesBasedData).reduce((monthCreationReportPeach, month) => {
      const monthCases = monthesBasedData[month];
      monthCreationReportPeach += `\n${month} - new cases ${monthCases.length}`;

      return monthCreationReportPeach;
    }, '');
    report += `\n${creationByMonthes}\n${getSeparator()}`;
  }
  if (fs.existsSync(allTestCasesGroupedCreationPerQAByMonthPathQAPath)) {
    const creationMonthPerQA = require(allTestCasesGroupedCreationPerQAByMonthPathQAPath);

    const creationByMonthesPerQA = Object.keys(creationMonthPerQA).reduce((monthCreationPerQAReportPeach, QA) => {
      const monthCases = creationMonthPerQA[QA];

      const perQAPerf = Object.keys(monthCases).reduce((monthCreationReportPeach, month) => {
        monthCreationReportPeach += `\n\t${month} ${monthCases[month]}`;

        return monthCreationReportPeach;
      }, '');

      monthCreationPerQAReportPeach += `\n${QA} ${perQAPerf}`;

      return monthCreationPerQAReportPeach;
    }, '');

    report += `\n${creationByMonthesPerQA}\n${getSeparator()}`;
  }
  if (fs.existsSync(allTestCasesGroupedUpdationByMonthPath)) {
    const monthesBasedData = require(allTestCasesGroupedUpdationByMonthPath);
    const creationByMonthes = Object.keys(monthesBasedData).reduce((monthCreationReportPeach, month) => {
      const monthCases = monthesBasedData[month];
      monthCreationReportPeach += `\n${month} - updated cases ${monthCases.length}`;

      return monthCreationReportPeach;
    }, '');
    report += `\n${creationByMonthes}\n${getSeparator()}`;
  }
  if (fs.existsSync(allTestCasesGroupedUpdationPerQAByMonthPath)) {
    const creationMonthPerQA = require(allTestCasesGroupedUpdationPerQAByMonthPath);

    const creationByMonthesPerQA = Object.keys(creationMonthPerQA).reduce((monthCreationPerQAReportPeach, QA) => {
      const monthCases = creationMonthPerQA[QA];

      const perQAPerf = Object.keys(monthCases).reduce((monthCreationReportPeach, month) => {
        monthCreationReportPeach += `\n\t${month} ${monthCases[month]}`;

        return monthCreationReportPeach;
      }, '');

      monthCreationPerQAReportPeach += `\n${QA} ${perQAPerf}`;

      return monthCreationPerQAReportPeach;
    }, '');

    report += `\n Updation ${creationByMonthesPerQA}\n${getSeparator()}`;
  }
  if (fs.existsSync(allTestCasesGroupedCreationAutomationByMonthPath)) {
    const monthesBasedData = require(allTestCasesGroupedCreationAutomationByMonthPath);
    const creationByMonthes = Object.keys(monthesBasedData).reduce((monthCreationReportPeach, month) => {
      const monthCases = monthesBasedData[month];
      monthCreationReportPeach += `\n${month} - created automated cases ${monthCases.length}`;

      return monthCreationReportPeach;
    }, '');
    report += `\n${creationByMonthes}\n${getSeparator()}`;
  }
  if (fs.existsSync(allTestCasesGroupedCreationAutomationPerQAByMonthPath)) {
    const creationMonthPerQA = require(allTestCasesGroupedCreationAutomationPerQAByMonthPath);

    const creationByMonthesPerQA = Object.keys(creationMonthPerQA).reduce((monthCreationPerQAReportPeach, QA) => {
      const monthCases = creationMonthPerQA[QA];

      const perQAPerf = Object.keys(monthCases).reduce((monthCreationReportPeach, month) => {
        monthCreationReportPeach += `\n\t${month} ${monthCases[month]}`;

        return monthCreationReportPeach;
      }, '');

      monthCreationPerQAReportPeach += `\n${QA} ${perQAPerf}`;

      return monthCreationPerQAReportPeach;
    }, '');

    report += `\n Creation ${creationByMonthesPerQA}\n${getSeparator()}`;
  }
  if (fs.existsSync(allTestCasesGroupedUpdationAutomationByMonthPath)) {
    const monthesBasedData = require(allTestCasesGroupedUpdationAutomationByMonthPath);
    const creationByMonthes = Object.keys(monthesBasedData).reduce((monthCreationReportPeach, month) => {
      const monthCases = monthesBasedData[month];
      monthCreationReportPeach += `\n${month} - updated automated cases ${monthCases.length}`;

      return monthCreationReportPeach;
    }, '');
    report += `\n${creationByMonthes}\n${getSeparator()}`;
  }
  if (fs.existsSync(allTestCasesGroupedUpdationAutomationPerQAByMonthPath)) {
    const creationMonthPerQA = require(allTestCasesGroupedUpdationAutomationPerQAByMonthPath);

    const creationByMonthesPerQA = Object.keys(creationMonthPerQA).reduce((monthCreationPerQAReportPeach, QA) => {
      const monthCases = creationMonthPerQA[QA];

      const perQAPerf = Object.keys(monthCases).reduce((monthCreationReportPeach, month) => {
        monthCreationReportPeach += `\n\t${month} ${monthCases[month]}`;

        return monthCreationReportPeach;
      }, '');

      monthCreationPerQAReportPeach += `\n${QA} ${perQAPerf}`;

      return monthCreationPerQAReportPeach;
    }, '');

    report += `\n Updation ${creationByMonthesPerQA}\n${getSeparator()}`;
  }

  console.log(report);
}

export { parseReportToConsoleOutput };
