import { strictEqual, throws, ok } from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';

const configFilePath = path.resolve(process.cwd(), './promod.system.config.js');

function clearModuleCache() {
  Object.keys(require.cache).forEach(key => {
    if (key.includes('/lib/generator/') || key.includes('/lib/config/') || key.includes('promod.system.config')) {
      delete require.cache[key];
    }
  });
}

function writeConfig(config: Record<string, any>) {
  fs.writeFileSync(configFilePath, `module.exports = ${JSON.stringify(config, null, 2)};`);
}

function writeConfigRaw(content: string) {
  fs.writeFileSync(configFilePath, content);
}

function requireResolvePage() {
  return require('../../lib/generator/resolve-page');
}

const baseConfig = {
  baseElementsActionsDescription: {
    Button: { click: { entryType: 'Action' }, _whereContent: { resultType: 'Content' } },
    Input: { sendKeys: { entryType: 'SetKeys' } },
  },
  collectionDescription: { action: '_action', where: '_whereContent' },
  baseLibraryDescription: {
    pageId: 'Page',
    entityId: 'id',
    fragmentId: 'Fragment',
    collectionId: 'ItemList',
  },
  promod: {},
  pathToBase: './base',
  resultActionsMap: {},
};

describe('resolve-page', function () {
  let configExisted: boolean;

  before(function () {
    configExisted = fs.existsSync(configFilePath);
  });

  after(function () {
    if (!configExisted && fs.existsSync(configFilePath)) {
      fs.unlinkSync(configFilePath);
    }
    clearModuleCache();
  });

  describe('loadPageModule', function () {
    let loadPageModule: (pagePath: string) => { [k: string]: any };

    before(function () {
      clearModuleCache();
      writeConfig(baseConfig);
      ({ loadPageModule } = requireResolvePage());
    });

    it('should load an existing module successfully', function () {
      const result = loadPageModule(require.resolve('path'));
      ok(result);
      strictEqual(typeof result.join, 'function');
    });

    it('should throw a descriptive error for non-existent module', function () {
      throws(
        () => loadPageModule('/non/existent/path/module.js'),
        (error: Error) => {
          ok(error.message.includes("Failed to load page module at '/non/existent/path/module.js'"));
          return true;
        },
      );
    });
  });

  describe('resolvePathToLibFolder', function () {
    let resolvePathToLibFolder: (pagePath: string) => string;
    const cwd = process.cwd();

    before(function () {
      clearModuleCache();
      writeConfig(baseConfig);
      ({ resolvePathToLibFolder } = requireResolvePage());
    });

    it('should compute relative path for deeply nested page', function () {
      const pagePath = path.join(cwd, 'lib', 'pages', 'login', 'login.page.ts');
      strictEqual(resolvePathToLibFolder(pagePath), '../../../');
    });

    it('should compute relative path for page in subdirectory', function () {
      const pagePath = path.join(cwd, 'lib', 'pages', 'login.page.ts');
      strictEqual(resolvePathToLibFolder(pagePath), '../../');
    });

    it('should return "./" for root-level page', function () {
      const pagePath = path.join(cwd, 'login.page.ts');
      strictEqual(resolvePathToLibFolder(pagePath), './');
    });
  });

  describe('getFilteredActions', function () {
    let getFilteredActions: () => string[];

    before(function () {
      clearModuleCache();
      writeConfig(baseConfig);
      ({ getFilteredActions } = requireResolvePage());
    });

    it('should return an array of strings', function () {
      const actions = getFilteredActions();
      ok(Array.isArray(actions));
      actions.forEach(a => strictEqual(typeof a, 'string'));
    });

    it('should filter out actions present in collectionDescription values', function () {
      const actions = getFilteredActions();
      // _whereContent is both in baseElementsActionsDescription (Button) and collectionDescription values
      ok(!actions.includes('_whereContent'), '_whereContent should be filtered out');
      ok(actions.includes('click'), 'click should remain');
      ok(actions.includes('sendKeys'), 'sendKeys should remain');
    });
  });

  describe('getFlowMatcher (expression mode)', function () {
    let getFlowMatcher: () => RegExp;

    before(function () {
      clearModuleCache();
      writeConfig(baseConfig); // promod: {} → expression mode
      ({ getFlowMatcher } = requireResolvePage());
    });

    it('should return a RegExp', function () {
      ok(getFlowMatcher() instanceof RegExp);
    });

    it('should match arrow-function expression names', function () {
      const matcher = getFlowMatcher();
      const result = 'const myFlow = async'.match(matcher);
      ok(result);
      strictEqual(result[0], 'myFlow');
    });
  });

  describe('getFlowMatcher (declaration mode)', function () {
    let getFlowMatcher: () => RegExp;

    before(function () {
      clearModuleCache();
      writeConfig({ ...baseConfig, promod: { actionsDeclaration: 'declaration' } });
      ({ getFlowMatcher } = requireResolvePage());
    });

    it('should match function declaration names', function () {
      const matcher = getFlowMatcher();
      const result = 'function myFlow'.match(matcher);
      ok(result);
      strictEqual(result[0], 'myFlow');
    });
  });

  describe('resolvePageFactory (pageId string mode)', function () {
    let resolvePageFactory: (pageModule: any, pagePath?: string) => () => any;

    before(function () {
      clearModuleCache();
      writeConfig(baseConfig); // pageId: 'Page'
      ({ resolvePageFactory } = requireResolvePage());
    });

    it('should find page class by string pageId and return a factory', function () {
      class LoginPage {
        id = 'Login';
      }
      const pageModule = { LoginPage };
      const factory = resolvePageFactory(pageModule);
      strictEqual(typeof factory, 'function');
      ok(factory() instanceof LoginPage);
    });

    it('should throw when no matching page class is found', function () {
      class Dashboard {
        id = 'Dashboard';
      }
      const pageModule = { Dashboard };
      throws(
        () => resolvePageFactory(pageModule),
        (error: Error) => {
          ok(error.message.includes('Page Class was not found'));
          return true;
        },
      );
    });
  });

  describe('resolvePageFactory (pageId regexp mode)', function () {
    let resolvePageFactory: (pageModule: any, pagePath?: string) => () => any;

    before(function () {
      clearModuleCache();
      writeConfigRaw(`module.exports = {
  baseElementsActionsDescription: {
    Button: { click: { entryType: 'Action' } },
  },
  collectionDescription: { action: '_action' },
  baseLibraryDescription: {
    pageId: /Page/,
    entityId: 'id',
    fragmentId: 'Fragment',
    collectionId: 'ItemList',
  },
  promod: {},
  pathToBase: './base',
  resultActionsMap: {},
};`);
      ({ resolvePageFactory } = requireResolvePage());
    });

    it('should find page class by regexp pageId', function () {
      class LoginPage {
        id = 'Login';
      }
      const pageModule = { LoginPage };
      const factory = resolvePageFactory(pageModule);
      strictEqual(typeof factory, 'function');
      ok(factory() instanceof LoginPage);
    });
  });

  describe('resolvePageFactory (getPageInstance mode)', function () {
    let resolvePageFactory: (pageModule: any, pagePath?: string) => () => any;

    before(function () {
      clearModuleCache();
      writeConfig({
        ...baseConfig,
        baseLibraryDescription: {
          ...baseConfig.baseLibraryDescription,
          getPageInstance: 'getPage',
        },
      });
      ({ resolvePageFactory } = requireResolvePage());
    });

    it('should return the factory function from the module', function () {
      const getPage = () => ({ id: 'test' });
      const pageModule = { getPage };
      const factory = resolvePageFactory(pageModule);
      strictEqual(factory, getPage);
    });

    it('should throw when factory function is not found in module', function () {
      const pageModule = { other: () => null };
      throws(
        () => resolvePageFactory(pageModule, '/path/to/page.ts'),
        (error: Error) => {
          ok(error.message.includes('Page "getPageInstance" method was not found'));
          ok(error.message.includes('getPage'));
          ok(error.message.includes('/path/to/page.ts'));
          return true;
        },
      );
    });
  });

  describe('resolvePageBaseLine (pageId mode)', function () {
    let resolvePageBaseLine: (pagePath: string, pageModule: any) => { getPage: () => any; pageBaseLine: string };

    before(function () {
      clearModuleCache();
      writeConfig(baseConfig);
      ({ resolvePageBaseLine } = requireResolvePage());
    });

    it('should generate import + constructor lines and return a factory', function () {
      class LoginPage {
        id = 'Login';
      }
      const pageModule = { LoginPage };
      const result = resolvePageBaseLine('/some/path/login.page.ts', pageModule);

      strictEqual(typeof result.getPage, 'function');
      ok(result.getPage() instanceof LoginPage);
      ok(result.pageBaseLine.includes("import { LoginPage } from './login.page'"));
      ok(result.pageBaseLine.includes('const page = new LoginPage()'));
    });

    it('should strip .ts extension from import path', function () {
      class MyPage {
        id = 'My';
      }
      const pageModule = { MyPage };
      const result = resolvePageBaseLine('/dir/my-file.ts', pageModule);

      ok(result.pageBaseLine.includes("from './my-file'"));
      ok(!result.pageBaseLine.includes('.ts'));
    });

    it('should throw when no matching page class is found', function () {
      class Widget {
        id = 'w';
      }
      const pageModule = { Widget };
      throws(
        () => resolvePageBaseLine('/some/path/page.ts', pageModule),
        (error: Error) => {
          ok(error.message.includes('Page Class was not found'));
          return true;
        },
      );
    });
  });

  describe('resolvePageBaseLine (getPageInstance mode)', function () {
    let resolvePageBaseLine: (pagePath: string, pageModule: any) => { getPage: () => any; pageBaseLine: string };

    before(function () {
      clearModuleCache();
      writeConfig({
        ...baseConfig,
        baseLibraryDescription: {
          ...baseConfig.baseLibraryDescription,
          getPageInstance: 'getPage',
        },
      });
      ({ resolvePageBaseLine } = requireResolvePage());
    });

    it('should generate named import and return the factory function', function () {
      const getPage = () => ({ id: 'test' });
      const pageModule = { getPage };
      const result = resolvePageBaseLine('/some/path/login.page.ts', pageModule);

      strictEqual(result.getPage, getPage);
      ok(result.pageBaseLine.includes("import { getPage } from './login.page'"));
      ok(!result.pageBaseLine.includes('const page = new'));
    });

    it('should throw when factory function is not found in module', function () {
      const pageModule = { unrelated: () => null };
      throws(
        () => resolvePageBaseLine('/some/path/page.ts', pageModule),
        (error: Error) => {
          ok(error.message.includes('Page "getPageInstance" method was not found'));
          return true;
        },
      );
    });
  });
});
