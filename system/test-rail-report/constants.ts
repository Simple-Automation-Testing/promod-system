// @ts-check
import { resolve } from 'path';
import * as fs from 'fs';

import { config } from '../config/config';

const {
  testrailReport = {
    outputDir: resolve(process.cwd(), './.testraildata'),
  },
} = config.get();

if (!fs.existsSync(testrailReport.outputDir)) {
  fs.mkdirSync(testrailReport.outputDir);
}

const allTestCasesPath = resolve(testrailReport.outputDir, './all.testcases.json');
const allTestCasesWithHistoryPath = resolve(testrailReport.outputDir, './all.testcases.with.history.json');

const allTestCasesGroupedCreationByMonthPath = resolve(testrailReport.outputDir, './all.testcases.creation.month.json');
const allTestCasesGroupedCreationByMonthPerQAPath = resolve(
  testrailReport.outputDir,
  './all.testcases.creation.perqa.month.json',
);

const allTestCasesGroupedUpdationByMonthPath = resolve(testrailReport.outputDir, './all.testcases.updation.month.json');
const allTestCasesGroupedUpdationPerQAByMonthPath = resolve(
  testrailReport.outputDir,
  './all.testcases.updation.perqa.month.json',
);

const allTestCasesGroupedUpdationAutomationByMonthPath = resolve(
  testrailReport.outputDir,
  './all.testcases.updation.automation.month.json',
);
const allTestCasesGroupedUpdationAutomationPerQAByMonthPath = resolve(
  testrailReport.outputDir,
  './all.testcases.updation.automation.perqa.month.json',
);
const allTestCasesGroupedCreationAutomationByMonthPath = resolve(
  testrailReport.outputDir,
  './all.testcases.new.automation.month.json',
);
const allTestCasesGroupedCreationAutomationPerQAByMonthPath = resolve(
  testrailReport.outputDir,
  './all.testcases.new.automation.perqa.month.json',
);

const allTestRunsPath = resolve(testrailReport.outputDir, './all.testruns.json');
const allTestRunsWithDetailsPath = resolve(testrailReport.outputDir, './all.testruns.details.json');
const testRunsWithDetailsPath = id => resolve(testrailReport.outputDir, `./${id}.testruns.details.json`);
const allTestRunsGroupedByMonthesPath = resolve(testrailReport.outputDir, './all.testruns.month.json');
const allTestRunsGroupedByMonthesPerQAPath = resolve(testrailReport.outputDir, './all.testruns.perqa.month.json');

const testRunsWithExecutionReportHTML = id => resolve(testrailReport.outputDir, `./${id}.testruns.details.html`);

const generalReportPath = resolve(testrailReport.outputDir, './general.qa.report.html');

export {
  allTestCasesPath,
  allTestCasesGroupedCreationByMonthPath,
  allTestCasesGroupedCreationByMonthPerQAPath,
  allTestCasesWithHistoryPath,
  allTestCasesGroupedUpdationByMonthPath,
  allTestCasesGroupedUpdationPerQAByMonthPath,
  allTestCasesGroupedUpdationAutomationByMonthPath,
  allTestCasesGroupedUpdationAutomationPerQAByMonthPath,
  allTestCasesGroupedCreationAutomationByMonthPath,
  allTestCasesGroupedCreationAutomationPerQAByMonthPath,
  allTestRunsPath,
  allTestRunsWithDetailsPath,
  allTestRunsGroupedByMonthesPath,
  allTestRunsGroupedByMonthesPerQAPath,
  testRunsWithDetailsPath,
  testRunsWithExecutionReportHTML,
  generalReportPath,
};
