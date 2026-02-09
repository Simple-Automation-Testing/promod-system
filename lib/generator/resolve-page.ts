import * as path from 'path';
import { isString, isRegExp } from 'sat-utils';
import { config } from '../config/config';
import { getAllBaseActions } from './utils';

const flowExpressionMatcher = /(?<=const ).*(?= = async)/gim;
const flowDeclarationMatcher = /(?<=function )[\w$]+/gim;

const { baseLibraryDescription, promod = {}, collectionDescription } = config.get();

function loadPageModule(pagePath: string): { [k: string]: any } {
  try {
    return require(pagePath);
  } catch (error) {
    throw new Error(`Failed to load page module at '${pagePath}': ${(error as Error).message}`);
  }
}

function resolvePageFactory(pageModule: { [k: string]: any }, pagePath?: string): () => any {
  if (baseLibraryDescription.getPageInstance) {
    const getPage = pageModule[baseLibraryDescription.getPageInstance];

    if (!getPage) {
      throw new Error(
        `Page "getPageInstance" method was not found. Search pattern is '${baseLibraryDescription.getPageInstance}', file path '${pagePath}'`,
      );
    }

    return getPage;
  }

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

  return () => new PageClass();
}

function resolvePageBaseLine(
  pagePath: string,
  pageModule: { [k: string]: any },
): { getPage: () => any; pageBaseLine: string } {
  const pageRelativeTsPath = path.basename(pagePath).replace('.ts', '');

  if (baseLibraryDescription.getPageInstance) {
    const getPage = pageModule[baseLibraryDescription.getPageInstance];

    if (!getPage) {
      throw new Error(
        `Page "getPageInstance" method was not found. Search pattern is '${baseLibraryDescription.getPageInstance}', file path '${pagePath}'`,
      );
    }

    const pageBaseLine = `import { ${baseLibraryDescription.getPageInstance} } from './${pageRelativeTsPath}';`;

    return { getPage, pageBaseLine };
  }

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

  const pageBaseLine = `import { ${PageClass.prototype.constructor.name} } from './${pageRelativeTsPath}';

const page = new ${PageClass.prototype.constructor.name}();`;

  return { getPage: () => new PageClass(), pageBaseLine };
}

function resolvePathToLibFolder(pagePath: string): string {
  const frameworkPath = process.cwd();
  const pageRelativePath = path.basename(pagePath);

  return (
    pagePath
      .replace(frameworkPath, '')
      .replace(pageRelativePath, '')
      .split('/')
      .splice(2)
      .map(() => '../')
      .join('') || './'
  );
}

function getFilteredActions(): string[] {
  return getAllBaseActions().filter(action => !Object.values(collectionDescription).includes(action));
}

function getFlowMatcher(): RegExp {
  return promod.actionsDeclaration === 'declaration' ? flowDeclarationMatcher : flowExpressionMatcher;
}

export { loadPageModule, resolvePageFactory, resolvePageBaseLine, resolvePathToLibFolder, getFilteredActions, getFlowMatcher };
