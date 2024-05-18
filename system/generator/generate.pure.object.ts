/* eslint-disable sonarjs/cognitive-complexity */
import { isString, isRegExp } from 'sat-utils';
import { config } from '../config/config';
import { getPureActionFlows } from './based-actions/get.pure.action.flows';
import { getAllBaseActions } from './utils';
import { getPureRandomResultsFlows } from './random-results-actions/get.pure.random.results.flows';
import { getPureCountFlows } from './collection-counts/get.pure.entities.count.object';

const flowExpressionMatcher = /(?<=const ).*(?= = async)/gim;
const flowDeclarationMatcher = /(?<=function )[\w$]+/gim;

const { baseLibraryDescription, promod = {}, collectionDescription } = config.get();

function createPurePageStructure(pagePath: string) {
  const flowMatcher = promod.actionsDeclaration === 'declaration' ? flowDeclarationMatcher : flowExpressionMatcher;

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
