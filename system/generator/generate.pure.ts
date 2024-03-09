/* eslint-disable sonarjs/cognitive-complexity */
import * as path from 'path';
import * as fs from 'fs';
import { isString, isRegExp } from 'sat-utils';
import { config } from '../config/config';
import { getPureActionFlows } from './api-based-actions/get.pure.action.flows';
import { getAllBaseActions } from './utils';
import { getPureRandomResultsFlows } from './random-results-actions/get.pure.random.results.flows';
import { getPureCountFlows } from './random-results-actions/get.pure.entities.count';

const flowExpressionMatcher = /(?<=const ).*(?= = async)/gim;
const flowDeclarationMatcher = /(?<=function )[\w$]+/gim;

function createPurePageStructure(pagePath: string) {
  const { baseLibraryDescription, promod = {}, collectionDescription } = config.get();

  const flowMatcher = promod.actionsDeclaration === 'declaration' ? flowDeclarationMatcher : flowExpressionMatcher;

  const pageRelativePath = path.isAbsolute(pagePath) ? path.basename(pagePath) : pagePath;
  const pageRelativeTsPath = pageRelativePath.replace('.ts', '');

  let getPage: () => any;
  let pageBaseLine;
  const pageModule = require(pagePath);

  if (baseLibraryDescription.getPageInstance) {
    getPage = pageModule[baseLibraryDescription.getPageInstance];

    if (!getPage) {
      throw new Error(
        `Page "getPageInstance" method was not found. Search pattern is '${baseLibraryDescription.getPageInstance}', file path '${pagePath}'`,
      );
    }

    pageBaseLine = `const { ${baseLibraryDescription.getPageInstance} } = require('./${pageRelativeTsPath}');`;
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

    pageBaseLine = `const { ${PageClass.prototype.constructor.name} } = require('${pagePath}');

const page = new ${PageClass.prototype.constructor.name}();`;

    getPage = () => new PageClass();
  }

  const pageInstance = getPage();

  const globalImport = `const { toArray, getRandomArrayItem,  } = require('sat-utils');


${pageBaseLine}
`;

  const pageName = pageInstance[baseLibraryDescription.entityId];

  const asActorAndPage = `on ${pageName}`;

  const actions = getAllBaseActions().filter(action => !Object.values(collectionDescription).includes(action));

  const interactionFlowsTemplate = actions.map(pageAction =>
    getPureActionFlows(asActorAndPage, pageInstance, pageAction),
  );
  const randomResultsFlowsTemplate = getPureRandomResultsFlows(asActorAndPage, pageInstance);

  const collectionEntities = getPureCountFlows(pageInstance, asActorAndPage);

  const body = `${globalImport}

${randomResultsFlowsTemplate}
${interactionFlowsTemplate.join('\n')}
${collectionEntities}

`;
  const flows = body.match(flowMatcher) || [];

  let commonExport = `module.exports = {
    ${flows.join(',\n  ')},
  }`;

  return `${body}
${commonExport}
`;
}

export { createPurePageStructure };
