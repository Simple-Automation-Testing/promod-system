/* eslint-disable complexity, sonarjs/cognitive-complexity, no-console*/
import { safeJSONstringify } from 'sat-utils';
import { config } from '../config/config';
import { checkThatElementHasAction } from './get.base';
import { getFragmentInteractionFields } from './utils';
import {
  getCollectionItemInstance,
  isCollectionWithItemBaseElement,
  isCollectionWithItemFragment,
} from './utils.collection';
import { getElementType } from './get.base';
import { getCollectionTypes, getFragmentTypes } from './get.instance.elements.type';

function getCollectionsPathes(instance) {
  const {
    baseElementsActionsDescription,
    baseLibraryDescription,
    collectionDescription,
    baseCollectionActionsDescription,
  } = config.get();

  function wrap(itemType) {
    return `Omit<${itemType}, '${collectionDescription.action}'>`;
  }

  const { action, ...collectionReducedType } = baseCollectionActionsDescription['get']['entryType'];
  if (isCollectionWithItemBaseElement(instance)) {
    return {
      [collectionDescription.action]: null,
      __countResult: getElementType(getCollectionItemInstance(instance), 'get', 'resultType'),
      _type: getCollectionTypes(instance, 'get', 'entryType', collectionReducedType, wrap),
      _fields: getFragmentInteractionFields(getCollectionItemInstance(instance)),
    };
  }

  if (isCollectionWithItemFragment(instance)) {
    return getCollectionsPathes(getCollectionItemInstance(instance));
  }

  const interactionFields = getFragmentInteractionFields(instance) || [];

  const result = {};

  for (const fragmentChildFieldName of interactionFields) {
    const childConstructorName = instance[fragmentChildFieldName].constructor.name;

    if (childConstructorName.includes(baseLibraryDescription.fragmentId)) {
      const nestedItem = getCollectionsPathes(instance[fragmentChildFieldName]);
      if (safeJSONstringify(nestedItem).includes(collectionDescription.action)) {
        result[fragmentChildFieldName] = nestedItem;
      }
    } else if (isCollectionWithItemFragment(instance[fragmentChildFieldName])) {
      const collectionInstance = getCollectionItemInstance(instance[fragmentChildFieldName]);
      result[fragmentChildFieldName] = {
        [collectionDescription.action]: getCollectionsPathes(collectionInstance),

        __countResult: getFragmentTypes(collectionInstance, 'get', 'resultType'),
        _type: getCollectionTypes(instance[fragmentChildFieldName], 'get', 'entryType', collectionReducedType, wrap),
        _fields: getFragmentInteractionFields(collectionInstance),
      };
    } else if (isCollectionWithItemBaseElement(instance[fragmentChildFieldName])) {
      const collectionInstance = getCollectionItemInstance(instance[fragmentChildFieldName]);
      result[fragmentChildFieldName] = {
        [collectionDescription.action]: null,

        __countResult: getElementType(collectionInstance, 'get', 'resultType'),
        _type: getCollectionTypes(instance[fragmentChildFieldName], 'get', 'entryType', collectionReducedType, wrap),
        _fields: getFragmentInteractionFields(collectionInstance),
      };
    } else if (baseElementsActionsDescription[childConstructorName]) {
      // noop
    }
  }

  return result;
}

function checkThatFragmentHasItemsToAction(instance, action: string) {
  const { baseElementsActionsDescription, baseLibraryDescription } = config.get();

  if (isCollectionWithItemBaseElement(instance)) {
    return checkThatElementHasAction(getCollectionItemInstance(instance), action);
  }

  if (isCollectionWithItemFragment(instance)) {
    return checkThatFragmentHasItemsToAction(getCollectionItemInstance(instance), action);
  }

  const interactionFields = getFragmentInteractionFields(instance) || [];

  let result = false;
  for (const fragmentChildFieldName of interactionFields) {
    const childConstructorName = instance[fragmentChildFieldName].constructor.name;

    if (childConstructorName.includes(baseLibraryDescription.fragmentId)) {
      result = checkThatFragmentHasItemsToAction(instance[fragmentChildFieldName], action);

      if (result) return result;
    } else if (isCollectionWithItemFragment(instance[fragmentChildFieldName])) {
      const collectionInstance = getCollectionItemInstance(instance[fragmentChildFieldName]);

      const result = checkThatFragmentHasItemsToAction(collectionInstance, action);

      if (result) return result;
    } else if (isCollectionWithItemBaseElement(instance[fragmentChildFieldName])) {
      result = checkThatElementHasAction(
        instance[fragmentChildFieldName][baseLibraryDescription.collectionItemId]?.name,
        action,
      );
      if (result) return result;
    } else if (baseElementsActionsDescription[childConstructorName]) {
      result = checkThatElementHasAction(childConstructorName, action);
      if (result) return result;
    }
  }

  return result;
}

export { checkThatFragmentHasItemsToAction, getCollectionsPathes };
