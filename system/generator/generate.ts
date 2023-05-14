/* eslint-disable sonarjs/cognitive-complexity */
import * as path from 'path';
import * as fs from 'fs';
import { isString, isRegExp, camelize } from 'sat-utils';
import { getBaseImport } from './get.base.import';
import { getAllBaseElements } from './get.base';
import { config } from '../config/config';
import { getActionFlows } from './get.action.flows';
import { getAllBaseActions } from './utils';
import { getRandomResultsFlows } from './get.random.results.flows';
import { getCountFlows } from './get.entities.count';

const { PROMOD_S_GENERATE_DEFAULT_IMPORT, PROMOD_S_GENERATE_ACTIONS_TYPE } = process.env;

const flowExpressionMatcher = /(?<=const ).*(?= = async)/gim;
const flowDeclarationMatcher = /(?<=function ).*(?=\()/gim;

function createPageStructure(pagePath: string) {
  const { pathToBase, baseLibraryDescription, promod = {}, collectionDescription } = config.get();

  const flowMatcher = promod.actionsDeclaration === 'declaration' ? flowDeclarationMatcher : flowExpressionMatcher;

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
  let pageBaseLine;
  const pageModule = require(pagePath);

  if (baseLibraryDescription.getPageInstance) {
    getPage = pageModule[baseLibraryDescription.getPageInstance];

    if (!getPage) {
      throw new Error(
        `Page "getPageInstance" method was not found. Search pattern is '${baseLibraryDescription.getPageInstance}'`,
      );
    }

    pageBaseLine = `import { ${baseLibraryDescription.getPageInstance} } from './${pageRelativeTsPath}';`;
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

    pageBaseLine = `import { ${PageClass.prototype.constructor.name} } from './${pageRelativeTsPath}';

const page = new ${PageClass.prototype.constructor.name}();`;

    getPage = () => new PageClass();
  }

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

  const actions = getAllBaseActions().filter(action => !Object.values(collectionDescription).includes(action));

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
