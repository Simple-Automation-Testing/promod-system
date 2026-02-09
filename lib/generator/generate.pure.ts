/* eslint-disable sonarjs/cognitive-complexity */
import { config } from '../config/config';
import { getPureActionFlows } from './based-actions/get.pure.action.flows';
import { getPureRandomResultsFlows } from './random-results-actions/get.pure.random.results.flows';
import { getPureCountFlows } from './collection-counts/get.pure.entities.count';
import { loadPageModule, resolvePageFactory, getFilteredActions, getFlowMatcher } from './resolve-page';

const { baseLibraryDescription } = config.get();

function createPurePageStructure(pagePath: string) {
  const flowMatcher = getFlowMatcher();
  const pageModule = loadPageModule(pagePath);
  const getPage = resolvePageFactory(pageModule, pagePath);
  const pageInstance = getPage();

  const pageName = pageInstance[baseLibraryDescription.entityId];

  const asActorAndPage = `on ${pageName}`;

  const actions = getFilteredActions();

  const interactionFlowsTemplate = actions.map(pageAction =>
    getPureActionFlows(asActorAndPage, pageInstance, pageAction),
  );
  const randomResultsFlowsTemplate = getPureRandomResultsFlows(asActorAndPage, pageInstance);

  const collectionEntities = getPureCountFlows(pageInstance, asActorAndPage);

  const actionsModule = `${randomResultsFlowsTemplate}
  ${interactionFlowsTemplate.join('\n')}
  ${collectionEntities}`;
  const flows = actionsModule.match(flowMatcher) || [];

  const body = `function getActions(page, {toArray, getRandomArrayItem}) {

  ${actionsModule}

  return {
    ${flows.join(',\n  ')},
  }
}`;

  let commonExport = `module.exports = getActions`;

  return `${body}
${commonExport}
`;
}

export { createPurePageStructure };
