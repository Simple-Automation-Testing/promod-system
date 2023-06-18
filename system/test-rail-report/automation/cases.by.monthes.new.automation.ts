import { config } from '../../config/config';

import { allTestCasesGroupedCreationAutomationByMonthPath } from '../constants';
import { createReportByMonthAutomation } from './base.cases.by.monthes.automation';

const { testrailReport } = config.get();

/**
 * !@info this one should be executed second
 * @param starDate
 * @param periodInMonthes
 */
function createReportByMonthAutomationNew(starDate: string, periodInMonthes: number) {
  createReportByMonthAutomation(
    starDate,
    periodInMonthes,
    testrailReport.automationNew,
    allTestCasesGroupedCreationAutomationByMonthPath,
  );
}

export { createReportByMonthAutomationNew };
