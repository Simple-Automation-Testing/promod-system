import { config } from '../../config/config';

import { allTestCasesGroupedUpdationAutomationByMonthPath } from '../constants';
import { createReportByMonthAutomation } from './tr.cases.by.monthes.base.automation';

const { testrailReport } = config.get();

function createReportByMonthAutomationUpdates(starDate: string, periodInMonthes: number) {
  createReportByMonthAutomation(
    starDate,
    periodInMonthes,
    testrailReport.automationUpdates,
    allTestCasesGroupedUpdationAutomationByMonthPath,
  );
}

export { createReportByMonthAutomationUpdates };
