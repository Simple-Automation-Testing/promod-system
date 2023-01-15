import { sleep } from 'sat-utils';
import fetch from 'node-fetch';
import { promodLogger } from '../logger';

import { config } from '../config/config';

const { testrailReport } = config.get();

const v2Api = 'index.php?/api/v2/';

async function getTestCases(projectId: number | string, suiteId: number | string, filters: string = '') {
  return fetch(`${testrailReport.hostUrl}${v2Api}get_cases/${projectId}/&suite_id=${suiteId}${filters}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${testrailReport.basicToken}`,
    },
  }).then(res => res.json());
}

async function getAllTestCasesFromProjectSuite(projectId: number | string, suiteId: number | string) {
  const testCases = [];
  let body = await getTestCases(projectId, suiteId);
  testCases.push(...body.cases);

  while (body._links && body._links.next && new URLSearchParams(body._links.next).get('offset')) {
    body = await getTestCases(projectId, suiteId, `&offset=${new URLSearchParams(body._links.next).get('offset')}`);
    testCases.push(...body.cases);
    await sleep(100);
  }

  return testCases;
}

async function getTestCaseHistory(caseId) {
  return fetch(`${testrailReport.hostUrl}${v2Api}get_history_for_case/${caseId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${testrailReport.basicToken}`,
    },
  })
    .then(res => res.json())
    .catch(error => {
      promodLogger.error(error);

      return getTestCaseHistory(caseId);
    });
}

export { getTestCases, getAllTestCasesFromProjectSuite, getTestCaseHistory };
