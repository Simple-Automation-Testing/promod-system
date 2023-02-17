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

  const pageName = pageInstance.identifier;

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

  fs.writeFileSync(
    `${pagePath.replace('.ts', '.actions.ts')}`,
    `${body}

export {
  ${flows.join(',\n  ')},
};
`,
  );
};

export { createPageStructure };
