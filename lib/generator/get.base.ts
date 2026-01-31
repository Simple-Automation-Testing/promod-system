/* eslint-disable unicorn/prefer-ternary, sonarjs/cognitive-complexity, no-console*/
import { isString } from 'sat-utils';
import { config } from '../config/config';

import { getCollectionItemInstance, isCollectionWithItemBaseElement } from './utils.collection';
import { getInstanceInteractionFields } from './utils';

const { baseElementsActionsDescription, baseLibraryDescription } = config.get();

/**
 * Extracts constructor name from either a string or an object instance.
 * Handles the common pattern of accepting both instance and constructor name.
 */
function getConstructorName(constructorNameOrInstance: string | object): string {
  if (isString(constructorNameOrInstance)) {
    return constructorNameOrInstance as string;
  }
  return (constructorNameOrInstance as object)?.constructor?.name ?? '';
}

function isBaseElementInstance(constructorNameOrInstance: string | object) {
  const constructorName = getConstructorName(constructorNameOrInstance);
  return Boolean(baseElementsActionsDescription[constructorName]);
}

function isCollectionInstance(constructorNameOrInstance: string | object) {
  const constructorName = getConstructorName(constructorNameOrInstance);
  return constructorName?.includes(baseLibraryDescription.collectionId);
}

function isFragmentInstance(constructorNameOrInstance: string | object) {
  const constructorName = getConstructorName(constructorNameOrInstance);
  return constructorName?.includes(baseLibraryDescription.fragmentId);
}

function checkThatElementHasAction(constructorNameOrInstance: string | object, action: string) {
  const constructorName = getConstructorName(constructorNameOrInstance);
  return isBaseElementInstance(constructorName) && Boolean(baseElementsActionsDescription[constructorName][action]);
}

function getElementType(instance, action: string, actionType: string) {
  const prop = instance?.constructor?.name;

  if (baseElementsActionsDescription[prop][action] && baseElementsActionsDescription[prop][action][actionType]) {
    return `${prop}${baseElementsActionsDescription[prop][action][actionType]}`;
  }

  return '';
}

function getElementActionType(instance, action: string, actionType: string) {
  const types = {};

  if (checkThatElementHasAction(instance, action)) {
    types[action] = getElementType(instance, action, actionType);
  }

  return types;
}

function getAllBaseElements(instance, baseElements = []) {
  if (instance?.constructor?.name === baseLibraryDescription.collectionId) {
    baseElements.push(baseLibraryDescription.collectionId);

    if (isCollectionWithItemBaseElement(instance)) {
      baseElements.push(getCollectionItemInstance(instance)?.constructor?.name);
    } else {
      const collectionInstance = getCollectionItemInstance(instance);

      const nestedBaseElements = getAllBaseElements(collectionInstance, []);

      baseElements.push(...nestedBaseElements);
    }
  }

  const interactionFields = getInstanceInteractionFields(instance);

  interactionFields.forEach(fragmentChildFieldName => {
    const childConstructorName = instance[fragmentChildFieldName].constructor.name;

    if (
      childConstructorName.includes(baseLibraryDescription.fragmentId) ||
      childConstructorName === baseLibraryDescription.collectionId
    ) {
      const nestedBaseElements = getAllBaseElements(instance[fragmentChildFieldName], []);

      baseElements.push(...nestedBaseElements);
    } else if (baseElementsActionsDescription[childConstructorName]) {
      baseElements.push(childConstructorName);
    }
  });

  return baseElements;
}

function getFragmentBaseElementsFields(instance) {
  const interationFields = getInstanceInteractionFields(instance);

  return interationFields.filter(field => isBaseElementInstance(instance[field]));
}

export {
  isBaseElementInstance,
  isCollectionInstance,
  getAllBaseElements,
  checkThatElementHasAction,
  getElementType,
  getElementActionType,
  getFragmentBaseElementsFields,
  isFragmentInstance,
};
