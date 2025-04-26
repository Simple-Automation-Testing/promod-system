import * as fs from 'fs';
import * as path from 'path';

const template = `
const commonActions = {
  click: {
    entryType: 'Action',
  },
  getContent: {
    entryType: 'Action',
    resultType: 'Content',
  },
  getVisibility: {
    entryType: 'Action',
    resultType: 'Visible',
  },
  waitContent: {
    entryType: 'Content',
  },
  _whereContent: {
    resultType: 'Content',
  },
  _whereVisibiliy: {
    resultType: 'Visible',
  },
};

const baseElementsActionsDescription = {
  Input: {
    setKeys: {
      entryType: 'SetKeys',
    },
    ...commonActions,
  },
  Button: {
    ...commonActions,
  },
  Text: {
    ...commonActions,
  },
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
  _whereContent: {
    entryType: {
      where: { action: '_whereContent', actionType: 'resultType' },
      visible: { action: '_whereVisibiliy', actionType: 'resultType' },
      generic: collectionActionTypes.action,
      action: { action: 'getContent', actionType: 'entryType' },
    },
    resultType: {
      where: { action: '_whereContent', actionType: 'resultType' },
      visible: { action: '_whereVisibiliy', actionType: 'resultType' },
      action: { action: 'getContent', actionType: 'entryType' },
      generic: collectionActionTypes.action,
    },
  },
  _whereVisibiliy: {
    entryType: {
      ...collectionGenericAction,
    },
    resultType: {
      ...collectionGenericAction,
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
  getPageInstance: 'getPage',

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
  _whereContent: {
    action: '_whereContent',
    actionType: 'resultType',
  },
  _whereVisibiliy: {
    action: '_whereVisibiliy',
    actionType: 'resultType',
  },
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
};
`;

function createTemplateConfig() {
  fs.writeFileSync(path.resolve(process.cwd(), './promod.system.config.js'), template);
}

export { createTemplateConfig, template };
