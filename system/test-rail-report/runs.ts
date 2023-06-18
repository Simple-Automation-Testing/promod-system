import { isNotEmptyArray } from 'sat-utils';
import * as fs from 'fs';
import { allTestRunsPath } from './constants';

import { config } from '../config/config';
import { getAllTestRunsFromProject } from './api.calls';

const { testrailReport } = config.get();

async function getAllTestRailTestRuns() {
  if (!isNotEmptyArray(testrailReport.projects)) {
    throw new Error('promod.system.config should have testrailReport property with projects');
  }

  const testRuns = [];

  for (const project of testrailReport.projects) {
    const result = await getAllTestRunsFromProject(project.ID);
    testRuns.push(...result);
  }

  // TODO add caching

  fs.writeFileSync(allTestRunsPath, JSON.stringify(testRuns));
}

export { getAllTestRailTestRuns };
