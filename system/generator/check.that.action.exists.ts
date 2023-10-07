/* eslint-disable complexity, sonarjs/cognitive-complexity, no-console*/
import { safeJSONstringify } from 'sat-utils';
import { config } from '../config/config';
import { checkThatElementHasAction, isBaseElement } from './get.base';
import { getInstanceInteractionFields } from './utils';
import { getElementType } from './get.base';
import { getCollectionTypes, getFragmentTypes } from './get.instance.elements.type';
import {
  getCollectionItemInstance,
  isCollectionWithItemBaseElement,
  isCollectionWithItemFragment,
} from './utils.collection';

const {
  baseElementsActionsDescription,
  baseLibraryDescription,
  collectionDescription,
  baseCollectionActionsDescription,
} = config.get();

function wrap(itemType) {
  return `Omit<${itemType}, '${collectionDescription.action}'>`;
}

function getCollectionsPathes(instance) {
  const { action, ...collectionReducedType } = baseCollectionActionsDescription['get']['entryType'];
  if (isCollectionWithItemBaseElement(instance)) {
    return {
      [collectionDescription.action]: null,
      __countResult: getElementType(getCollectionItemInstance(instance), 'get', 'resultType'),
      _type: getCollectionTypes(instance, 'get', 'entryType', collectionReducedType, wrap),
      _fields: getInstanceInteractionFields(getCollectionItemInstance(instance)),
    };
  }

  if (isCollectionWithItemFragment(instance)) {
    return getCollectionsPathes(getCollectionItemInstance(instance));
  }

  const interactionFields = getInstanceInteractionFields(instance);

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
        _fields: getInstanceInteractionFields(collectionInstance),
      };
    } else if (isCollectionWithItemBaseElement(instance[fragmentChildFieldName])) {
      const collectionInstance = getCollectionItemInstance(instance[fragmentChildFieldName]);
      result[fragmentChildFieldName] = {
        [collectionDescription.action]: null,

        __countResult: getElementType(collectionInstance, 'get', 'resultType'),
        _type: getCollectionTypes(instance[fragmentChildFieldName], 'get', 'entryType', collectionReducedType, wrap),
        _fields: getInstanceInteractionFields(collectionInstance),
      };
    } else if (baseElementsActionsDescription[childConstructorName]) {
      // noop
    }
  }

  return result;
}

function checkThatInstanceHasActionItems(instance, action: string) {
  if (isCollectionWithItemBaseElement(instance)) {
    return checkThatElementHasAction(getCollectionItemInstance(instance), action);
  }

  if (isCollectionWithItemFragment(instance)) {
    return checkThatInstanceHasActionItems(getCollectionItemInstance(instance), action);
  }

  if (isBaseElement(instance)) {
    return checkThatElementHasAction(instance, action);
  }

  const interactionFields = getInstanceInteractionFields(instance);

  let result = false;
  for (const fragmentChildFieldName of interactionFields) {
    const childConstructorName = instance[fragmentChildFieldName]?.constructor?.name;

    if (childConstructorName.includes(baseLibraryDescription.fragmentId)) {
      result = checkThatInstanceHasActionItems(instance[fragmentChildFieldName], action);

      if (result) return result;
    } else if (
      isCollectionWithItemFragment(instance[fragmentChildFieldName]) ||
      isCollectionWithItemBaseElement(instance[fragmentChildFieldName])
    ) {
      const collectionInstance = getCollectionItemInstance(instance[fragmentChildFieldName]);

      const result = checkThatInstanceHasActionItems(collectionInstance, action);

      if (result) return result;
    } else if (baseElementsActionsDescription[childConstructorName]) {
      result = checkThatElementHasAction(childConstructorName, action);
      if (result) return result;
    }
  }

  return result;
}

export { checkThatInstanceHasActionItems, getCollectionsPathes };
