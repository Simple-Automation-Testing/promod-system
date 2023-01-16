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
const allTestCasesGroupedCreationPerQAByMonthPathQAPath = resolve(
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
  process.cwd(),
  './all.testcases.updation.automation.perqa.month.json',
);
const allTestCasesGroupedCreationAutomationByMonthPath = resolve(
  testrailReport.outputDir,
  './all.testcases.new.automation.month.json',
);
const allTestCasesGroupedCreationAutomationPerQAByMonthPath = resolve(
  process.cwd(),
  './all.testcases.new.automation.perqa.month.json',
);

export {
  allTestCasesPath,
  allTestCasesGroupedCreationByMonthPath,
  allTestCasesGroupedCreationPerQAByMonthPathQAPath,
  allTestCasesWithHistoryPath,
  allTestCasesGroupedUpdationByMonthPath,
  allTestCasesGroupedUpdationPerQAByMonthPath,
  allTestCasesGroupedUpdationAutomationByMonthPath,
  allTestCasesGroupedUpdationAutomationPerQAByMonthPath,
  allTestCasesGroupedCreationAutomationByMonthPath,
  allTestCasesGroupedCreationAutomationPerQAByMonthPath,
};
