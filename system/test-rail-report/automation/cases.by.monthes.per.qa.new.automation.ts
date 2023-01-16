import {
  allTestCasesGroupedCreationAutomationByMonthPath,
  allTestCasesGroupedCreationAutomationPerQAByMonthPath,
} from '../constants';
import { getBaseAutomationTestCaseGroupedByMonthPerQA } from './base.cases.by.monthes.per.qa.automation';

function getNewAutomationTestCaseGroupedByMonthPerQA() {
  getBaseAutomationTestCaseGroupedByMonthPerQA(
    allTestCasesGroupedCreationAutomationByMonthPath,
    allTestCasesGroupedCreationAutomationPerQAByMonthPath,
  );
}

export { getNewAutomationTestCaseGroupedByMonthPerQA };
