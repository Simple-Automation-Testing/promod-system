import {
  allTestCasesGroupedNewAutomationByMonthPath,
  allTestCasesGroupedNewAutomationPerQAByMonthPath,
} from '../constants';
import { getBaseAutomationTestCaseGroupedByMonthPerQA } from './tr.cases.by.monthes.per.qa.base.automation';

function getNewAutomationTestCaseGroupedByMonthPerQA() {
  getBaseAutomationTestCaseGroupedByMonthPerQA(
    allTestCasesGroupedNewAutomationByMonthPath,
    allTestCasesGroupedNewAutomationPerQAByMonthPath,
  );
}

export { getNewAutomationTestCaseGroupedByMonthPerQA };
