/* eslint-disable sonarjs/cognitive-complexity */
import * as path from 'path';
import * as fs from 'fs';
import { isString, isRegExp, camelize } from 'sat-utils';
import { getBaseImport } from './get.base.import';
import { getAllBaseElements } from './get.base';
import { config } from '../config/config';
import { getActionFlowsTypes } from './api-based-actions/get.action.flows.types';
import { getAllBaseActions } from './utils';
import { getRandomResultsFlowsTypes } from './random-results-actions/get.random.results.flows.types';
import { getCountFlowsTypes } from './random-results-actions/get.entities.count.types';

const { PROMOD_S_GENERATE_DEFAULT_IMPORT, PROMOD_S_GENERATE_ACTIONS_TYPE } = process.env;

const flowDeclarationMatcher = /(?<=function )[\w$]+/gim;

const { pathToBase, baseLibraryDescription, collectionDescription } = config.get();

function createPageActionTypes(pagePath: string) {
  const flowMatcher = flowDeclarationMatcher;

  const frameworkPath = process.cwd();
  const pageRelativePath = path.basename(pagePath);
  const pageRelativeTsPath = pageRelativePath.replace('.ts', '');
  const pathToLibFolder =
    pagePath
      .replace(frameworkPath, '')
      .replace(pageRelativePath, '')
      .split('/')
      .splice(2)
      .map(() => '../')
      .join('') || './';

  let getPage: () => any;
  const pageModule = require(pagePath);

  if (baseLibraryDescription.getPageInstance) {
    getPage = pageModule[baseLibraryDescription.getPageInstance];

    if (!getPage) {
      throw new Error(
        `Page "getPageInstance" method was not found. Search pattern is '${baseLibraryDescription.getPageInstance}', file path '${pagePath}'`,
      );
    }
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

    getPage = () => new PageClass();
  }

  const pageInstance = getPage();

  const globalImport = `import type { TresultBasedOnArgument, TobjectFromStringArray } from 'promod-system'
import type {
    ${getBaseImport(getAllBaseElements(pageInstance))}
  } from '${pathToLibFolder}${pathToBase}';

`;

  const pageName = pageInstance[baseLibraryDescription.entityId];

  const asActorAndPage = `on ${pageName}`;
  const mainActions = camelize(`${pageName} Actions`);

  const actions = getAllBaseActions().filter(action => !Object.values(collectionDescription).includes(action));

  const interactionFlowsTemplate = actions.map(pageAction =>
    getActionFlowsTypes(asActorAndPage, pageInstance, pageAction),
  );
  const randomResultsFlowsTemplate = getRandomResultsFlowsTypes(asActorAndPage, pageInstance);

  const collectionEntities = getCountFlowsTypes(pageInstance, asActorAndPage);

  const body = `${globalImport}

${randomResultsFlowsTemplate}
${interactionFlowsTemplate.join('\n')}
${collectionEntities}

`;
  const flows = body.match(flowMatcher) || [];

  let defaultExport = '';
  let actionsType = '';
  let commonExport = `export type pageActionTypes = {
    ${flows.map(flowType => `${flowType}: typeof ${flowType}`).join(',\n  ')},
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
    `${pagePath.replace('.ts', '.actions.types.ts')}`,
    `${body}
${defaultExport}
${actionsType}
${commonExport}
`,
  );
}

export { createPageActionTypes };
