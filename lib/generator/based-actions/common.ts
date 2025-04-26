import { camelize, isObject } from 'sat-utils';

import { config } from '../../config/config';

import { getElementsTypes, getFragmentTypes } from '../create.type';
import { getCollectionsPathes } from '../create.type';
import { getActionsList } from '../utils.random';

const { baseLibraryDescription = {}, collectionActionTypes, actionWithWaitOpts = [] } = config.get();

function getFlowRestArguments(action: string): string {
  // TODO this should be done via config
  if (actionWithWaitOpts.includes(action)) {
    return `, opts?: ${baseLibraryDescription.waitOptionsId}`;
  } else if (baseLibraryDescription.generalActionOptionsId) {
    return `, opts?: ${baseLibraryDescription.generalActionOptionsId}`;
  }

  return '';
}

const noTransormTypes = new Set(['void', 'boolean']);

function getFlowTypes(instance: object, action: string, name: string, elementType?: boolean) {
  return {
    flowArgumentType: elementType
      ? getElementsTypes(instance, action, 'entryType')
      : getFragmentTypes(instance, action, 'entryType'),
    flowResultType: elementType
      ? getElementsTypes(instance, action, 'resultType')
      : getFragmentTypes(instance, action, 'resultType'),
    // eslint-disable-next-line sonarjs/no-nested-template-literals
    typeName: `T${camelize(`${name} ${action}`)}`,
  };
}

function shouldResultTypeBeBasedOnArgument(resultTypeClarification, argumentType) {
  if (noTransormTypes.has(resultTypeClarification.trim())) {
    return false;
  }

  return !(
    isObject(collectionActionTypes) &&
    Object.values(collectionActionTypes).some(collectionAction => argumentType.startsWith(collectionAction))
  );
}

function getCollectionFlowTemplate(asActorAndPage, pageInstance, createFlowTemplates) {
  const data = getCollectionsPathes(pageInstance);
  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    return `${flows}${createFlowTemplates(asActorAndPage, dataObject)}\n`;
  }, '');
}

function getCollectionFlowObj(asActorAndPage, pageInstance, createFlowObj) {
  const data = getCollectionsPathes(pageInstance);
  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    const actions = createFlowObj(asActorAndPage, dataObject, pageInstance);

    return { ...flows, ...actions };
  }, {});
}

export {
  getFlowRestArguments,
  getFlowTypes,
  noTransormTypes,
  shouldResultTypeBeBasedOnArgument,
  getCollectionFlowTemplate,
  getCollectionFlowObj,
};
