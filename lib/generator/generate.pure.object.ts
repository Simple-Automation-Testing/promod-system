/* eslint-disable sonarjs/cognitive-complexity */
import { config } from '../config/config';
import { getPureActionFlowsObject } from './based-actions/get.pure.action.flows.object';
import { getPureRandomResultsFlowsObject } from './random-results-actions/get.pure.random.results.flows.object';
import { getPureCountFlowsObject } from './collection-counts/get.pure.entities.count.object';
import { loadPageModule, resolvePageFactory, getFilteredActions } from './resolve-page';

const { baseLibraryDescription } = config.get();

function createPurePageActions(pagePath: string) {
  const pageModule = loadPageModule(pagePath);
  const getPage = resolvePageFactory(pageModule, pagePath);
  const pageInstance = getPage();

  const pageName = pageInstance[baseLibraryDescription.entityId];

  const asActorAndPage = `on ${pageName}`;

  const actions = getFilteredActions();

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
