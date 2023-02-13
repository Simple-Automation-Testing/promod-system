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

async function getTestRuns(projectId: number | string, filters: string = '') {
  return fetch(`${testrailReport.hostUrl}${v2Api}get_runs/${projectId}${filters}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${testrailReport.basicToken}`,
    },
  }).then(res => res.json());
}

async function getTestRunResults(runId: number | string, filters: string = '') {
  return fetch(`${testrailReport.hostUrl}${v2Api}get_results_for_run/${runId}${filters}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${testrailReport.basicToken}`,
    },
  }).then(res => res.json());
}

async function getAllTestRunResults(runId: number | string) {
  const testRunsResults = [];
  let body = await getTestRunResults(runId);
  testRunsResults.push(...body.results);

  while (body._links && body._links.next && new URLSearchParams(body._links.next).get('offset')) {
    body = await getTestRunResults(runId, `&offset=${new URLSearchParams(body._links.next).get('offset')}`);
    testRunsResults.push(...body.results);
    await sleep(30);
  }

  return testRunsResults;
}

async function getTestCaseExecutionResult(runId: number | string, caseId: string | number, filters: string = '') {
  return fetch(`${testrailReport.hostUrl}${v2Api}get_results_for_case/${runId}/${caseId}${filters}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${testrailReport.basicToken}`,
    },
  })
    .then(res => res.json())
    .catch(error => {
      promodLogger.error(error);

      return getTestCaseExecutionResult(runId, caseId, filters);
    });
}

async function getAllTestCaseExecutionResult(runId: number | string, caseId: string | number) {
  const testRunResults = [];
  let body = await getTestCaseExecutionResult(runId, caseId);
  if (body.results) {
    testRunResults.push(...body.results);
  }

  while (body._links && body._links.next && new URLSearchParams(body._links.next).get('offset')) {
    body = await getTestCaseExecutionResult(
      runId,
      caseId,
      `&offset=${new URLSearchParams(body._links.next).get('offset')}`,
    );
    testRunResults.push(...body.results);
    await sleep(30);
  }

  return testRunResults;
}

async function getAllTestRunsFromProject(projectId: number | string) {
  const testRuns = [];
  let body = await getTestRuns(projectId);
  testRuns.push(...body.runs);

  while (body._links && body._links.next && new URLSearchParams(body._links.next).get('offset')) {
    body = await getTestRuns(projectId, `&offset=${new URLSearchParams(body._links.next).get('offset')}`);
    testRuns.push(...body.runs);
    await sleep(100);
  }

  return testRuns;
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

export {
  getTestCases,
  getAllTestCasesFromProjectSuite,
  getTestCaseHistory,
  getTestRuns,
  getAllTestRunsFromProject,
  getTestRunResults,
  getAllTestRunResults,
  getTestCaseExecutionResult,
  getAllTestCaseExecutionResult,
};
