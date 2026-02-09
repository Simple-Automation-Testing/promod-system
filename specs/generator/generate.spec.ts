import { strictEqual, ok } from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';

const configFilePath = path.resolve(process.cwd(), './promod.system.config.js');

const fixturesDir = path.resolve(__dirname, 'fixtures');
const testPagePath = path.resolve(fixturesDir, 'test-page.ts');
const testPageFactoryPath = path.resolve(fixturesDir, 'test-page-factory.ts');

// Files that generators write — cleaned up after each describe
const generatedFiles = [
  path.resolve(fixturesDir, 'test-page.actions.ts'),
  path.resolve(fixturesDir, 'test-page.actions.types.d.ts'),
  path.resolve(fixturesDir, 'test-page.get.actions.ts'),
  path.resolve(fixturesDir, 'test-page-factory.actions.ts'),
  path.resolve(fixturesDir, 'test-page-factory.actions.types.d.ts'),
  path.resolve(fixturesDir, 'test-page-factory.get.actions.ts'),
];

function clearModuleCache() {
  Object.keys(require.cache).forEach(key => {
    if (key.includes('/lib/generator/') || key.includes('/lib/config/') || key.includes('promod.system.config')) {
      delete require.cache[key];
    }
  });
}

function removeGeneratedFiles() {
  generatedFiles.forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
}

// Full config based on the project's config template (without getPageInstance — pageId mode)
const pageIdConfig = `
const commonActions = {
  click: { entryType: 'Action' },
  getContent: { entryType: 'Action', resultType: 'Content' },
  getVisibility: { entryType: 'Action', resultType: 'Visible' },
  waitContent: { entryType: 'Content' },
  _whereContent: { resultType: 'Content' },
  _whereVisibiliy: { resultType: 'Visible' },
};

const baseElementsActionsDescription = {
  Input: { setKeys: { entryType: 'SetKeys' }, ...commonActions },
  Button: { ...commonActions },
  Text: { ...commonActions },
};

const collectionActionTypes = {
  action: 'TItemListAction',
  check: 'TItemListCheck',
  compare: 'TItemListCompare',
};

const collectionDescription = {
  action: '_action',
  where: '_whereContent',
  visible: '_whereVisibiliy',
  length: 'length',
};

const collectionGenericAction = {
  where: { action: '_whereContent', actionType: 'resultType' },
  visible: { action: '_whereVisibiliy', actionType: 'resultType' },
  generic: collectionActionTypes.action,
};

const baseCollectionActionsDescription = {
  getContent: {
    entryType: {
      ...collectionGenericAction,
      action: { action: 'getContent', actionType: 'entryType' },
    },
    resultType: {
      action: { action: 'getContent', actionType: 'resultType' },
      endType: '[]',
    },
  },
  getVisibility: {
    entryType: {
      ...collectionGenericAction,
      action: { action: 'getVisibility', actionType: 'entryType' },
    },
    resultType: {
      click: { action: 'getVisibility', actionType: 'resultType' },
      endType: '[]',
    },
  },
  setKeys: {
    entryType: {
      ...collectionGenericAction,
      action: { action: 'setKeys', actionType: 'entryType' },
    },
  },
  click: {
    entryType: {
      ...collectionGenericAction,
      action: { action: 'click', actionType: 'entryType' },
    },
  },
  waitContent: {
    entryType: {
      where: { action: '_whereContent', actionType: 'resultType' },
      visible: { action: '_whereVisibiliy', actionType: 'resultType' },
      action: { action: 'getContent', actionType: 'entryType' },
      generic: collectionActionTypes.check,
    },
  },
};

const resultActionsMap = {
  click: 'void',
  getContent: 'resultType',
  getVisibility: 'resultType',
  setKeys: 'void',
  waitVisibility: 'void',
  waitContent: 'void',
};

const baseLibraryDescription = {
  getDataMethod: 'getContent',
  getVisibilityMethod: 'getVisibility',
  waitVisibilityMethod: 'waitVisibility',
  waitContentMethod: 'waitContent',
  entityId: 'id',
  pageId: 'Page',
  fragmentId: 'Fragment',
  waitOptionsId: 'TWaitOpts',
  generalActionOptionsId: 'TActionOpts',
  collectionId: 'ItemList',
  collectionRootElementsId: 'roots',
  getCollectionItemInstance: 'getListItem',
  getCollectionTypeFormat: 'object',
};

const collectionRandomDataDescription = {
  _whereContent: { action: '_whereContent', actionType: 'resultType' },
  _whereVisibiliy: { action: '_whereVisibiliy', actionType: 'resultType' },
};

module.exports = {
  pathToBase: 'lib',
  baseElementsActionsDescription,
  baseCollectionActionsDescription,
  resultActionsMap,
  baseLibraryDescription,
  collectionDescription,
  collectionRandomDataDescription,
  collectionActionTypes,
  promod: {},
};
`;

// Same config but with getPageInstance for factory mode
const factoryConfig = pageIdConfig.replace(
  'const baseLibraryDescription = {',
  "const baseLibraryDescription = {\n  getPageInstance: 'getPage',",
);

describe('generate files', function () {
  let configExisted: boolean;

  before(function () {
    configExisted = fs.existsSync(configFilePath);
  });

  after(function () {
    if (!configExisted && fs.existsSync(configFilePath)) {
      fs.unlinkSync(configFilePath);
    }
    removeGeneratedFiles();
    clearModuleCache();
  });

  describe('createPageStructure', function () {
    describe('with pageId config', function () {
      let createPageStructure: (pagePath: string) => void;

      before(function () {
        clearModuleCache();
        removeGeneratedFiles();
        delete process.env.PROMOD_S_GENERATE_DEFAULT_IMPORT;
        delete process.env.PROMOD_S_GENERATE_ACTIONS_TYPE;
        fs.writeFileSync(configFilePath, pageIdConfig);
        ({ createPageStructure } = require('../../lib/generator/generate'));
      });

      after(function () {
        removeGeneratedFiles();
      });

      it('should write .actions.ts file', function () {
        createPageStructure(testPagePath);
        const outputPath = testPagePath.replace('.ts', '.actions.ts');
        ok(fs.existsSync(outputPath), '.actions.ts file should exist');
      });

      it('should include sat-utils import', function () {
        const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.ts'), 'utf-8');
        ok(content.includes("from 'sat-utils'"), 'should import from sat-utils');
      });

      it('should include promod-system type import', function () {
        const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.ts'), 'utf-8');
        ok(content.includes("from 'promod-system'"), 'should import from promod-system');
      });

      it('should include page class import', function () {
        const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.ts'), 'utf-8');
        ok(content.includes("import { LoginPage } from './test-page'"), 'should import LoginPage');
      });

      it('should include page constructor call', function () {
        const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.ts'), 'utf-8');
        ok(content.includes('const page = new LoginPage()'), 'should construct page instance');
      });

      it('should include base import types', function () {
        const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.ts'), 'utf-8');
        ok(content.includes('InputAction') || content.includes('ButtonAction'), 'should include element type imports');
      });

      it('should contain export block', function () {
        const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.ts'), 'utf-8');
        ok(content.includes('export {') || content.includes('export default'), 'should have exports');
      });
    });

    describe('with PROMOD_S_GENERATE_DEFAULT_IMPORT', function () {
      let createPageStructure: (pagePath: string) => void;

      before(function () {
        clearModuleCache();
        removeGeneratedFiles();
        process.env.PROMOD_S_GENERATE_DEFAULT_IMPORT = 'true';
        delete process.env.PROMOD_S_GENERATE_ACTIONS_TYPE;
        fs.writeFileSync(configFilePath, pageIdConfig);
        ({ createPageStructure } = require('../../lib/generator/generate'));
      });

      after(function () {
        delete process.env.PROMOD_S_GENERATE_DEFAULT_IMPORT;
        removeGeneratedFiles();
      });

      it('should produce default export', function () {
        createPageStructure(testPagePath);
        const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.ts'), 'utf-8');
        ok(content.includes('export default'), 'should have default export');
      });

      it('should not have named export block', function () {
        const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.ts'), 'utf-8');
        ok(!content.includes('export {'), 'should not have named export');
      });
    });

    describe('with PROMOD_S_GENERATE_ACTIONS_TYPE and no default import', function () {
      let createPageStructure: (pagePath: string) => void;

      before(function () {
        clearModuleCache();
        removeGeneratedFiles();
        delete process.env.PROMOD_S_GENERATE_DEFAULT_IMPORT;
        process.env.PROMOD_S_GENERATE_ACTIONS_TYPE = 'true';
        fs.writeFileSync(configFilePath, pageIdConfig);
        ({ createPageStructure } = require('../../lib/generator/generate'));
      });

      after(function () {
        delete process.env.PROMOD_S_GENERATE_ACTIONS_TYPE;
        removeGeneratedFiles();
      });

      it('should include actions type export', function () {
        createPageStructure(testPagePath);
        const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.ts'), 'utf-8');
        ok(content.includes('export type T'), 'should have type export');
      });
    });

    describe('with getPageInstance factory config', function () {
      let createPageStructure: (pagePath: string) => void;

      before(function () {
        clearModuleCache();
        removeGeneratedFiles();
        delete process.env.PROMOD_S_GENERATE_DEFAULT_IMPORT;
        delete process.env.PROMOD_S_GENERATE_ACTIONS_TYPE;
        fs.writeFileSync(configFilePath, factoryConfig);
        ({ createPageStructure } = require('../../lib/generator/generate'));
      });

      after(function () {
        removeGeneratedFiles();
      });

      it('should write .actions.ts using factory import', function () {
        createPageStructure(testPageFactoryPath);
        const content = fs.readFileSync(testPageFactoryPath.replace('.ts', '.actions.ts'), 'utf-8');
        ok(content.includes("import { getPage } from './test-page-factory'"), 'should import getPage factory');
        ok(!content.includes('const page = new'), 'should not have constructor call');
      });
    });
  });

  describe('createPurePageStructure', function () {
    let createPurePageStructure: (pagePath: string) => string;

    before(function () {
      clearModuleCache();
      fs.writeFileSync(configFilePath, pageIdConfig);
      ({ createPurePageStructure } = require('../../lib/generator/generate.pure'));
    });

    it('should return a string', function () {
      const result = createPurePageStructure(testPagePath);
      strictEqual(typeof result, 'string');
    });

    it('should wrap actions in getActions function', function () {
      const result = createPurePageStructure(testPagePath);
      ok(result.includes('function getActions(page, {toArray, getRandomArrayItem})'), 'should have getActions wrapper');
    });

    it('should export via module.exports', function () {
      const result = createPurePageStructure(testPagePath);
      ok(result.includes('module.exports = getActions'), 'should have CommonJS export');
    });

    it('should include a return block with flow names', function () {
      const result = createPurePageStructure(testPagePath);
      ok(result.includes('return {'), 'should have return block');
    });
  });

  describe('createPurePageActions', function () {
    let createPurePageActions: (pagePath: string) => { [k: string]: any };

    before(function () {
      clearModuleCache();
      fs.writeFileSync(configFilePath, pageIdConfig);
      ({ createPurePageActions } = require('../../lib/generator/generate.pure.object'));
    });

    it('should return an object', function () {
      const result = createPurePageActions(testPagePath);
      strictEqual(typeof result, 'object');
      ok(result !== null);
    });

    it('should return action functions', function () {
      const result = createPurePageActions(testPagePath);
      const values = Object.values(result);
      ok(values.length > 0, 'should have at least one action');
      values.forEach(fn => strictEqual(typeof fn, 'function'));
    });

    it('should have action names derived from page name', function () {
      const result = createPurePageActions(testPagePath);
      const keys = Object.keys(result);
      // Page id is 'Login', so action names should contain 'Login' somewhere
      const hasLoginKey = keys.some(k => k.toLowerCase().includes('login'));
      ok(hasLoginKey, `action keys should reference page name, got: ${keys.join(', ')}`);
    });
  });

  describe('createPageActionTypes', function () {
    let createPageActionTypes: (pagePath: string) => void;

    before(function () {
      clearModuleCache();
      removeGeneratedFiles();
      fs.writeFileSync(configFilePath, pageIdConfig);
      ({ createPageActionTypes } = require('../../lib/generator/generate.types'));
    });

    after(function () {
      removeGeneratedFiles();
    });

    it('should write .actions.types.d.ts file', function () {
      createPageActionTypes(testPagePath);
      const outputPath = testPagePath.replace('.ts', '.actions.types.d.ts');
      ok(fs.existsSync(outputPath), '.actions.types.d.ts should exist');
    });

    it('should write .get.actions.ts file', function () {
      const outputPath = testPagePath.replace('.ts', '.get.actions.ts');
      ok(fs.existsSync(outputPath), '.get.actions.ts should exist');
    });

    it('should include type imports in .actions.types.d.ts', function () {
      const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.types.d.ts'), 'utf-8');
      ok(content.includes("from 'promod-system'"), 'should import from promod-system');
      ok(content.includes('import type'), 'should use type imports');
    });

    it('should include base element type imports', function () {
      const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.types.d.ts'), 'utf-8');
      ok(content.includes('TWaitOpts'), 'should import wait options type');
    });

    it('should export a combined actions type', function () {
      const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.types.d.ts'), 'utf-8');
      ok(content.includes('export type T'), 'should have type export');
      ok(content.includes('Types'), 'should export combined types object');
    });

    it('should generate get.actions.ts with action getter function', function () {
      const content = fs.readFileSync(testPagePath.replace('.ts', '.get.actions.ts'), 'utf-8');
      ok(content.includes("from 'promod-system'"), 'should import createPurePageActions');
      ok(content.includes("from 'sat-utils'"), 'should import from sat-utils');
      ok(content.includes('export {'), 'should export the getter function');
    });

    it('should include decorators parameter in getter function', function () {
      const content = fs.readFileSync(testPagePath.replace('.ts', '.get.actions.ts'), 'utf-8');
      ok(content.includes('decorators'), 'should have decorators parameter');
    });

    it('should set .id property on the getter function', function () {
      const content = fs.readFileSync(testPagePath.replace('.ts', '.get.actions.ts'), 'utf-8');
      ok(content.includes(".id = '"), 'should set static id property');
    });
  });

  describe('createPageActionTypesWithFragments', function () {
    let createPageActionTypesWithFragments: (pagePath: string) => void;

    before(function () {
      clearModuleCache();
      removeGeneratedFiles();
      fs.writeFileSync(configFilePath, pageIdConfig);
      ({ createPageActionTypesWithFragments } = require('../../lib/generator/generate.types'));
    });

    after(function () {
      removeGeneratedFiles();
    });

    it('should write .actions.types.d.ts file', function () {
      createPageActionTypesWithFragments(testPagePath);
      const outputPath = testPagePath.replace('.ts', '.actions.types.d.ts');
      ok(fs.existsSync(outputPath), '.actions.types.d.ts should exist');
    });

    it('should write .get.actions.ts file', function () {
      const outputPath = testPagePath.replace('.ts', '.get.actions.ts');
      ok(fs.existsSync(outputPath), '.get.actions.ts should exist');
    });

    it('should include fragment types section', function () {
      const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.types.d.ts'), 'utf-8');
      ok(content.includes('Fragment Types'), 'should have fragment types section');
    });

    it('should include type imports', function () {
      const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.types.d.ts'), 'utf-8');
      ok(content.includes("from 'promod-system'"), 'should import from promod-system');
    });

    it('should export a combined actions type', function () {
      const content = fs.readFileSync(testPagePath.replace('.ts', '.actions.types.d.ts'), 'utf-8');
      ok(content.includes('export type T'), 'should have type export');
    });

    it('should generate get.actions.ts identical to non-fragment variant', function () {
      const content = fs.readFileSync(testPagePath.replace('.ts', '.get.actions.ts'), 'utf-8');
      ok(content.includes("from 'promod-system'"), 'should import createPurePageActions');
      ok(content.includes('export {'), 'should export the getter');
    });
  });
});
