/* eslint-disable sonarjs/cognitive-complexity */
import { isString, isRegExp } from 'sat-utils';
import { config } from '../config/config';
import { getAllBaseActions } from './utils';
import { getPureActionFlowsObject } from './based-actions/get.pure.action.flows.object';
import { getPureRandomResultsFlowsObject } from './random-results-actions/get.pure.random.results.flows.object';
import { getPureCountFlowsObject } from './collection-counts/get.pure.entities.count.object';

const { baseLibraryDescription, collectionDescription } = config.get();

function createPurePageActions(pagePath: string) {
  const pageModule = require(pagePath);
  let pageInstance;

  if (baseLibraryDescription.getPageInstance) {
    const getPage = pageModule[baseLibraryDescription.getPageInstance];

    if (!getPage) {
      throw new Error(
        `Page "getPageInstance" method was not found. Search pattern is '${baseLibraryDescription.getPageInstance}', file path '${pagePath}'`,
      );
    }
    pageInstance = getPage();
  } else {
    const PageClass = Object.values(pageModule as { [k: string]: any }).find(({ name }: { name: string }) => {
      if (isString(baseLibraryDescription.pageId)) {
        return name.includes(baseLibraryDescription.pageId);
      } else if (isRegExp(baseLibraryDescription.pageId)) {
        return name.match(baseLibraryDescription.pageId);
      } else {
        throw new TypeError('"pageId" should exist in "baseLibraryDescription", pageId should be a string or regexp');
      }
    });

    if (!PageClass) {
      throw new Error(`Page Class was not found. Search pattern is '${baseLibraryDescription.pageId}'`);
    }

    pageInstance = new PageClass();
  }

  const pageName = pageInstance[baseLibraryDescription.entityId];

  const asActorAndPage = `on ${pageName}`;

  const actions = getAllBaseActions().filter(action => !Object.values(collectionDescription).includes(action));

  const interactionFlows = actions.map(pageAction =>
    getPureActionFlowsObject(asActorAndPage, pageInstance, pageAction),
  );
  const randomResultsFlows = getPureRandomResultsFlowsObject(asActorAndPage, pageInstance);

  const collectionEntities = getPureCountFlowsObject(pageInstance, asActorAndPage);

  return interactionFlows.reduce((actions, baseActionFlows) => ({ ...actions, ...baseActionFlows }), {
    ...collectionEntities,
    ...randomResultsFlows,
  });
}

export { createPurePageActions };
