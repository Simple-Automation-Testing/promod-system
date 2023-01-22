import * as fs from 'fs';
import { allTestRunsPath } from './constants';

import { config } from '../config/config';
import { getAllTestRunsFromProject } from './api.calls';

const { testrailReport } = config.get();

async function getAllTestRailTestRuns() {
  const testRuns = [];

  for (const project of testrailReport.projects) {
    const result = await getAllTestRunsFromProject(project.ID);
    testRuns.push(...result);
  }

  fs.writeFileSync(allTestRunsPath, JSON.stringify(testRuns));
}

export { getAllTestRailTestRuns };
