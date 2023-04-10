import * as path from 'path';
import * as fs from 'fs';
import { isString, isRegExp } from 'sat-utils';
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

const createPageStructure = (pagePath: string) => {
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

  const pageModule = require(pagePath);

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

  const pageInstance = new PageClass();

  const globalImport = `import { toArray, getRandomArrayItem } from 'sat-utils';
import {
    ${getBaseImport(getAllBaseElements(pageInstance))}
  } from '${pathToLibFolder}${pathToBase}';

type TresultBasedOnArgument<TflowcallArgument, TflowResult extends Record<string | number | symbol, unknown>> = {
  [K in keyof TflowcallArgument]: TflowResult[K];
};

`;

  const pageName = pageInstance[baseLibraryDescription.entityId];

  const asActorAndPage = `on ${pageName}`;

  const actions = getAllBaseActions().filter(action => !Object.values(collectionDescription).includes(action));

  const interactionFlowsTemplate = actions.map(pageAction => getActionFlows(asActorAndPage, pageInstance, pageAction));
  const randomResultsFlowsTemplate = getRandomResultsFlows(asActorAndPage, pageInstance);

  const collectionEntities = getCountFlows(pageInstance, asActorAndPage);

  const body = `${globalImport}

  import { ${PageClass.prototype.constructor.name} } from './${pageRelativeTsPath}';


  const page = new ${PageClass.prototype.constructor.name}();
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
    defaultExport = `const ${pageName}Actions = {
  ${flows.join(',\n  ')},
}
export default ${pageName}Actions;
`;

    commonExport = '';
  }

  if (PROMOD_S_GENERATE_ACTIONS_TYPE && defaultExport !== '') {
    actionsType = `export type T${pageName}Actions = typeof ${pageName}Actions;`;
  }

  if (PROMOD_S_GENERATE_ACTIONS_TYPE && defaultExport === '') {
    actionsType = `const ${pageName}Actions = {
  ${flows.join(',\n  ')},
}

export type T${pageName}Actions = typeof ${pageName}Actions;`;
  }

  fs.writeFileSync(
    `${pagePath.replace('.ts', '.actions.ts')}`,
    `${body}
${defaultExport}
${actionsType}
${commonExport}
`,
  );
};

export { createPageStructure };
