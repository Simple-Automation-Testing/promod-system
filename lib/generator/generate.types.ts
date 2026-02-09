/* eslint-disable sonarjs/cognitive-complexity */
import * as path from 'path';
import * as fs from 'fs';
import { camelize } from 'sat-utils';
import { getBaseImport } from './get.base.import';
import { getAllBaseElements } from './get.base';
import { config } from '../config/config';
import { getActionFlowsTypes, getActionFlowsTypesWithFragmentRef } from './based-actions/get.action.flows.types';
import { getRandomResultsFlowsTypes } from './random-results-actions/get.random.results.flows.types';
import { getCountFlowsTypes } from './collection-counts/get.entities.count.types';
import { generateFragmentTypeDeclarations } from './fragment-types';
import { loadPageModule, resolvePageFactory, resolvePathToLibFolder, getFilteredActions } from './resolve-page';

const flowDeclarationMatcher = /(?<=function )[\w$]+/gim;

const { pathToBase, baseLibraryDescription } = config.get();

interface GenerationOptions {
  /** When true, generates types per fragment and reuses them at function level */
  useFragmentTypes?: boolean;
}

function createPageActionTypes(pagePath: string) {
  const flowMatcher = flowDeclarationMatcher;

  const pathToLibFolder = resolvePathToLibFolder(pagePath);
  const pageModule = loadPageModule(pagePath);
  const getPage = resolvePageFactory(pageModule, pagePath);
  const pageInstance = getPage();

  const globalImport = `import type { TresultBasedOnArgument, TobjectFromStringArray } from 'promod-system'
import type {
    ${getBaseImport(getAllBaseElements(pageInstance))}
  } from '${pathToLibFolder}${pathToBase}';

`;

  const pageName = pageInstance[baseLibraryDescription.entityId];

  const asActorAndPage = `on ${pageName}`;

  const actions = getFilteredActions();

  const interactionFlowsTemplate = actions.map(pageAction =>
    getActionFlowsTypes(asActorAndPage, pageInstance, pageAction),
  );
  const randomResultsFlowsTemplate = getRandomResultsFlowsTypes(asActorAndPage, pageInstance);

  const collectionEntities = getCountFlowsTypes(pageInstance, asActorAndPage);

  const getActionsName = camelize(`get${pageName}Actions`);

  const body = `${globalImport}

${randomResultsFlowsTemplate}
${interactionFlowsTemplate.join('\n')}
${collectionEntities}
`;
  const flows = body.match(flowMatcher) || [];

  let defaultExport = '';
  let actionsType = '';
  let commonExport = `export type T${getActionsName}Types = {
    ${flows.map(flowType => `${flowType}: typeof ${flowType}`).join(',\n  ')},
  }`;

  fs.writeFileSync(
    `${pagePath.replace('.ts', '.actions.types.d.ts')}`,
    `${body}
${defaultExport}
${actionsType}
${commonExport}
`,
  );

  fs.writeFileSync(
    `${pagePath.replace('.ts', '.get.actions.ts')}`,
    `import { resolve } from 'path';
import { createPurePageActions } from 'promod-system';
import { isArray, isFunction } from 'sat-utils';

function ${getActionsName}(decorators = [], preSetUp?: () => void, postSetUp?: () => void) {
  const pagePath = resolve(__dirname, './${path.basename(pagePath).replace(path.extname(pagePath), '')}');

  if(!isArray(decorators)) {
    throw new TypeError('decorators should be an array');
  }

  if(preSetUp) {
    preSetUp()
  }

  const pageActions = createPurePageActions(pagePath)

  if(postSetUp) {
    postSetUp()
  }

  return decorators.reduce((actFlows, decorator) => {
    if(!isFunction(decorator)) {
      throw new TypeError('decorator should be a function that returns actions object');
    }

    return decorator(actFlows);
  }, pageActions);
}

${getActionsName}.id = '${camelize(asActorAndPage)}';

export { ${getActionsName} }
  `,
  );
}

/**
 * Creates page action types with fragment-based type generation.
 * Types are generated per fragment first, then reused at function level.
 * This reduces duplication and makes types more maintainable.
 */
function createPageActionTypesWithFragments(pagePath: string) {
  const flowMatcher = flowDeclarationMatcher;

  const pathToLibFolder = resolvePathToLibFolder(pagePath);
  const pageModule = loadPageModule(pagePath);
  const getPage = resolvePageFactory(pageModule, pagePath);
  const pageInstance = getPage();

  const globalImport = `import type { TresultBasedOnArgument, TobjectFromStringArray } from 'promod-system'
import type {
    ${getBaseImport(getAllBaseElements(pageInstance))}
  } from '${pathToLibFolder}${pathToBase}';

`;

  const pageName = pageInstance[baseLibraryDescription.entityId];
  const asActorAndPage = `on ${pageName}`;

  // Generate fragment types first
  const { declarations: fragmentTypeDeclarations } = generateFragmentTypeDeclarations(pageInstance);

  const actions = getFilteredActions();

  // Generate function declarations using fragment type references
  const interactionFlowsTemplate = actions.map(pageAction =>
    getActionFlowsTypesWithFragmentRef(asActorAndPage, pageInstance, pageAction),
  );
  const randomResultsFlowsTemplate = getRandomResultsFlowsTypes(asActorAndPage, pageInstance);

  const collectionEntities = getCountFlowsTypes(pageInstance, asActorAndPage);

  const getActionsName = camelize(`get${pageName}Actions`);

  const body = `${globalImport}

/** ====================== Fragment Types ================== */
${fragmentTypeDeclarations}
/** ====================== End Fragment Types ================== */

${randomResultsFlowsTemplate}
${interactionFlowsTemplate.join('\n')}
${collectionEntities}
`;
  const flows = body.match(flowMatcher) || [];

  let defaultExport = '';
  let actionsType = '';
  let commonExport = `export type T${getActionsName}Types = {
    ${flows.map(flowType => `${flowType}: typeof ${flowType}`).join(',\n  ')},
  }`;

  fs.writeFileSync(
    `${pagePath.replace('.ts', '.actions.types.d.ts')}`,
    `${body}
${defaultExport}
${actionsType}
${commonExport}
`,
  );

  fs.writeFileSync(
    `${pagePath.replace('.ts', '.get.actions.ts')}`,
    `import { resolve } from 'path';
import { createPurePageActions } from 'promod-system';
import { isArray, isFunction } from 'sat-utils';

function ${getActionsName}(decorators = [], preSetUp?: () => void, postSetUp?: () => void) {
  const pagePath = resolve(__dirname, './${path.basename(pagePath).replace(path.extname(pagePath), '')}');

  if(!isArray(decorators)) {
    throw new TypeError('decorators should be an array');
  }

  if(preSetUp) {
    preSetUp()
  }

  const pageActions = createPurePageActions(pagePath)

  if(postSetUp) {
    postSetUp()
  }

  return decorators.reduce((actFlows, decorator) => {
    if(!isFunction(decorator)) {
      throw new TypeError('decorator should be a function that returns actions object');
    }

    return decorator(actFlows);
  }, pageActions);
}

${getActionsName}.id = '${camelize(asActorAndPage)}';

export { ${getActionsName} }
  `,
  );
}

export { createPageActionTypes, createPageActionTypesWithFragments, GenerationOptions };
