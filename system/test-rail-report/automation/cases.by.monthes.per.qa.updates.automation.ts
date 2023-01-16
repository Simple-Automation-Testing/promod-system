import {
  allTestCasesGroupedUpdationAutomationByMonthPath,
  allTestCasesGroupedUpdationAutomationPerQAByMonthPath,
} from '../constants';
import { getBaseAutomationTestCaseGroupedByMonthPerQA } from './base.cases.by.monthes.per.qa.automation';

function getUpdatedAutomationTestCaseGroupedByMonthPerQA() {
  getBaseAutomationTestCaseGroupedByMonthPerQA(
    allTestCasesGroupedUpdationAutomationByMonthPath,
    allTestCasesGroupedUpdationAutomationPerQAByMonthPath,
  );
}

export { getUpdatedAutomationTestCaseGroupedByMonthPerQA };
