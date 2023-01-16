import { config } from '../../config/config';

import { allTestCasesGroupedNewAutomationByMonthPath } from '../constants';
import { createReportByMonthAutomation } from './tr.cases.by.monthes.base.automation';

const { testrailReport } = config.get();

function createReportByMonthAutomationNew(starDate: string, periodInMonthes: number) {
  createReportByMonthAutomation(
    starDate,
    periodInMonthes,
    testrailReport.automationNew,
    allTestCasesGroupedNewAutomationByMonthPath,
  );
}

export { createReportByMonthAutomationNew };
