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
  getCollectionType,
  isCollectionInstance,
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
  // TODO this needs to be getted from the config
  const { action, ...collectionReducedType } = baseCollectionActionsDescription['get']['entryType'];
  if (isCollectionWithItemBaseElement(instance)) {
    return {
      [collectionDescription.action]: null,
      // TODO this needs to be getted from the config
      __countResult: getElementType(getCollectionItemInstance(instance), 'get', 'resultType'),
      // TODO this needs to be getted from the config
      _type: getCollectionTypes(instance, 'get', 'entryType', collectionReducedType, wrap),
      _fields: getInstanceInteractionFields(getCollectionItemInstance(instance)),
    };
  }

  if (isCollectionWithItemFragment(instance)) {
    return getCollectionsPathes(getCollectionItemInstance(instance));
  }

  const interactionFields = getInstanceInteractionFields(instance);
  // TODO document this
  return interactionFields.reduce((result, field) => {
    const childConstructorName = instance[field].constructor.name;

    if (childConstructorName.includes(baseLibraryDescription.fragmentId)) {
      const nestedItem = getCollectionsPathes(instance[field]);
      if (safeJSONstringify(nestedItem).includes(collectionDescription.action)) {
        result[field] = nestedItem;
      }
    } else if (isCollectionInstance(instance[field])) {
      const { fragment } = getCollectionType(instance[field]);
      const collectionInstance = getCollectionItemInstance(instance[field]);

      result[field] = {
        [collectionDescription.action]: fragment ? getCollectionsPathes(collectionInstance) : null,

        __countResult: (fragment ? getFragmentTypes : getElementType)(collectionInstance, 'get', 'resultType'),
        _type: getCollectionTypes(instance[field], 'get', 'entryType', collectionReducedType, wrap),
        _fields: getInstanceInteractionFields(collectionInstance),
      };
    }

    return result;
  }, {});
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

  return interactionFields.some(field => {
    const fieldConstructorName = instance[field].constructor.name;
    if (fieldConstructorName.includes(baseLibraryDescription.fragmentId)) {
      return checkThatInstanceHasActionItems(instance[field], action);
    } else if (isCollectionWithItemFragment(instance[field]) || isCollectionWithItemBaseElement(instance[field])) {
      const collectionInstance = getCollectionItemInstance(instance[field]);

      return checkThatInstanceHasActionItems(collectionInstance, action);
    } else if (baseElementsActionsDescription[fieldConstructorName]) {
      return checkThatElementHasAction(fieldConstructorName, action);
    }
  });
}

export { checkThatInstanceHasActionItems, getCollectionsPathes };
