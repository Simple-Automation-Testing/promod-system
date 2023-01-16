import {
  allTestCasesGroupedUpdationAutomationByMonthPath,
  allTestCasesGroupedUpdationAutomationPerQAByMonthPath,
} from '../constants';
import { getBaseAutomationTestCaseGroupedByMonthPerQA } from './tr.cases.by.monthes.per.qa.base.automation';

function getUpdatedAutomationTestCaseGroupedByMonthPerQA() {
  getBaseAutomationTestCaseGroupedByMonthPerQA(
    allTestCasesGroupedUpdationAutomationByMonthPath,
    allTestCasesGroupedUpdationAutomationPerQAByMonthPath,
  );
}

export { getUpdatedAutomationTestCaseGroupedByMonthPerQA };
