import { camelize, isObject } from 'sat-utils';

import { config } from '../../config/config';

import { getElementsTypes, getFragmentTypes } from '../create.type';
import { getCollectionsPaths } from '../create.type';
import { getActionsList } from '../utils.random';

const { baseLibraryDescription = {}, collectionActionTypes, actionWithWaitOpts = [] } = config.get();

/**
 * Gets the optional second argument string for flow functions.
 * @param action - The action name
 * @param includeTypes - Whether to include TypeScript type annotations (default: true)
 * @returns The argument string (e.g., ", opts?: WaitOptions" or ", opts")
 */
function getFlowRestArguments(action: string, includeTypes = true): string {
  if (actionWithWaitOpts.includes(action)) {
    return includeTypes ? `, opts?: ${baseLibraryDescription.waitOptionsId}` : `, opts`;
  } else if (baseLibraryDescription.generalActionOptionsId) {
    return includeTypes ? `, opts?: ${baseLibraryDescription.generalActionOptionsId}` : `, opts`;
  }

  return '';
}

/**
 * Checks if an action has optional arguments.
 */
function hasOptionalArguments(action: string): boolean {
  return actionWithWaitOpts.includes(action) || Boolean(baseLibraryDescription.generalActionOptionsId);
}

const noTransformTypes = new Set(['void', 'boolean']);

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
  if (noTransformTypes.has(resultTypeClarification.trim())) {
    return false;
  }

  return !(
    isObject(collectionActionTypes) &&
    Object.values(collectionActionTypes).some(collectionAction => argumentType.startsWith(collectionAction))
  );
}

function getCollectionFlowTemplate(asActorAndPage, pageInstance, createFlowTemplates) {
  const data = getCollectionsPaths(pageInstance);
  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    return `${flows}${createFlowTemplates(asActorAndPage, dataObject)}\n`;
  }, '');
}

function getCollectionFlowObj(asActorAndPage, pageInstance, createFlowObj) {
  const data = getCollectionsPaths(pageInstance);
  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    const actions = createFlowObj(asActorAndPage, dataObject, pageInstance);

    return { ...flows, ...actions };
  }, {});
}

export {
  getFlowRestArguments,
  hasOptionalArguments,
  getFlowTypes,
  noTransformTypes,
  shouldResultTypeBeBasedOnArgument,
  getCollectionFlowTemplate,
  getCollectionFlowObj,
};
