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

const flowDeclarationMatcher = /(?<=function )[\w$]+/gim;

const { pathToBase, baseLibraryDescription, collectionDescription } = config.get();

function createPageActionTypes(pagePath: string) {
  const flowMatcher = flowDeclarationMatcher;

  const frameworkPath = process.cwd();
  const pageRelativePath = path.basename(pagePath);
  const pathToLibFolder =
    pagePath
      .replace(frameworkPath, '')
      .replace(pageRelativePath, '')
      .split('/')
      .splice(2)
      .map(() => '../')
      .join('') || './';

  let getPage: () => any;
  let PageClass;
  const pageModule = require(pagePath);

  if (baseLibraryDescription.getPageInstance) {
    getPage = pageModule[baseLibraryDescription.getPageInstance];

    if (!getPage) {
      throw new Error(
        `Page "getPageInstance" method was not found. Search pattern is '${baseLibraryDescription.getPageInstance}', file path '${pagePath}'`,
      );
    }
  } else {
    PageClass = Object.values(pageModule as { [k: string]: any }).find(({ name }: { name: string }) => {
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

  const actions = getAllBaseActions().filter(action => !Object.values(collectionDescription).includes(action));

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

  const getPageRequire = baseLibraryDescription.getPageInstance || PageClass.prototype.constructor.name;
  const page = `${baseLibraryDescription.getPageInstance || 'new ' + PageClass.prototype.constructor.name}();`;

  fs.writeFileSync(
    `${pagePath.replace('.ts', '.get.actions.ts')}`,
    `import { resolve } from 'path';
import { createPurePageStructure } from 'promod-system';
import { isArray, isFunction, getRandomArrayItem, toArray, getCommonJsModuleFromSourceString } from 'sat-utils';

function ${getActionsName}(decorators = [], preSetUp?: () => void, postSetUp?: () => void) {
  const pagePath = resolve(__dirname, './${path.basename(pagePath).replace(path.extname(pagePath), '')}');
  const { ${getPageRequire} } = require(pagePath)

  if(!isArray(decorators)) {
    throw new TypeError('decorators should be an array');
  }

  if(preSetUp) {
    preSetUp()
  }

  const pageActionsGetter = getCommonJsModuleFromSourceString(createPurePageStructure(pagePath), './page.actions.js');

  if(postSetUp) {
    postSetUp()
  }

  return decorators.reduce((actFlows, decorator) => {
    if(!isFunction(decorator)) {
      throw new TypeError('decorator should be a function that returns actions object');
    }

    return decorator(actFlows);
  }, pageActionsGetter(${page}, { getRandomArrayItem, toArray }));
}

${getActionsName}.id = '${camelize(asActorAndPage)}';

export { ${getActionsName} }
  `,
  );
}

export { createPageActionTypes };
