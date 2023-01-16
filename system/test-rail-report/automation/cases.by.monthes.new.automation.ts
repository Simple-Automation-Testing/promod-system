import { config } from '../../config/config';

import { allTestCasesGroupedCreationAutomationByMonthPath } from '../constants';
import { createReportByMonthAutomation } from './base.cases.by.monthes.automation';

const { testrailReport } = config.get();

function createReportByMonthAutomationNew(starDate: string, periodInMonthes: number) {
  createReportByMonthAutomation(
    starDate,
    periodInMonthes,
    testrailReport.automationNew,
    allTestCasesGroupedCreationAutomationByMonthPath,
  );
}

export { createReportByMonthAutomationNew };
