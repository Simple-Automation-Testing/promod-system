import * as fs from 'fs';
import { allTestCasesPath } from './constants';

import { config } from '../config/config';
import { getAllTestCasesFromProjectSuite } from './api.calls';

const { testrailReport } = config.get();

async function getAllTestRailTestCases() {
  const testCases = [];

  for (const project of testrailReport.projects) {
    const suites = Object.values(project.SUITS) as string[];
    for (const suiteId of suites) {
      const result = await getAllTestCasesFromProjectSuite(project.ID, suiteId);
      testCases.push(...result);
    }
  }

  fs.writeFileSync(allTestCasesPath, JSON.stringify(testCases));
}

export { getAllTestRailTestCases };
