/* eslint-disable sonarjs/cognitive-complexity */
import * as path from 'path';
import * as fs from 'fs';
import { camelize } from 'sat-utils';
import { getBaseImport } from './get.base.import';
import { getAllBaseElements } from './get.base';
import { config } from '../config/config';
import { getActionFlows } from './based-actions/get.action.flows';
import { getRandomResultsFlows } from './random-results-actions/get.random.results.flows';
import { getCountFlows } from './collection-counts/get.entities.count';
import { loadPageModule, resolvePageBaseLine, resolvePathToLibFolder, getFilteredActions, getFlowMatcher } from './resolve-page';

const { PROMOD_S_GENERATE_DEFAULT_IMPORT, PROMOD_S_GENERATE_ACTIONS_TYPE } = process.env;

const { pathToBase, baseLibraryDescription } = config.get();

function createPageStructure(pagePath: string) {
  const flowMatcher = getFlowMatcher();
  const pathToLibFolder = resolvePathToLibFolder(pagePath);
  const pageModule = loadPageModule(pagePath);
  const { getPage, pageBaseLine } = resolvePageBaseLine(pagePath, pageModule);
  const pageInstance = getPage();

  const globalImport = `import { toArray, getRandomArrayItem } from 'sat-utils';
import type { TresultBasedOnArgument, TobjectFromStringArray } from 'promod-system'
import {
    ${getBaseImport(getAllBaseElements(pageInstance))}
  } from '${pathToLibFolder}${pathToBase}';

${pageBaseLine}

`;

  const pageName = pageInstance[baseLibraryDescription.entityId];

  const asActorAndPage = `on ${pageName}`;
  const mainActions = camelize(`${pageName} Actions`);

  const actions = getFilteredActions();

  const interactionFlowsTemplate = actions.map(pageAction => getActionFlows(asActorAndPage, pageInstance, pageAction));
  const randomResultsFlowsTemplate = getRandomResultsFlows(asActorAndPage, pageInstance);

  const collectionEntities = getCountFlows(pageInstance, asActorAndPage);

  const body = `${globalImport}

${randomResultsFlowsTemplate}
${interactionFlowsTemplate.join('\n')}
${collectionEntities}

`;
  const flows = body.match(flowMatcher) || [];

  let defaultExport = '';
  let actionsType = '';
  let commonExport = `export {
    ${flows.join(',\n  ')},
  }`;

  if (PROMOD_S_GENERATE_DEFAULT_IMPORT) {
    defaultExport = `const ${mainActions} = {
  ${flows.join(',\n  ')},
}
export default ${mainActions};
`;

    commonExport = '';
  }

  if (PROMOD_S_GENERATE_ACTIONS_TYPE && defaultExport !== '') {
    actionsType = `export type T${mainActions} = typeof ${mainActions};`;
  }

  if (PROMOD_S_GENERATE_ACTIONS_TYPE && defaultExport === '') {
    actionsType = `const ${mainActions} = {
  ${flows.join(',\n  ')},
}

export type T${mainActions} = typeof ${mainActions};`;
  }

  fs.writeFileSync(
    `${pagePath.replace('.ts', '.actions.ts')}`,
    `${body}
${defaultExport}
${actionsType}
${commonExport}
`,
  );
}

export { createPageStructure };
