/* eslint-disable no-console */
import { safeJSONstringify } from 'sat-utils';

import { config } from '../config/config';

import { checkThatInstanceHasActionItems } from './check.that.action.exists';
import { checkThatElementHasAction, getElementActionType, getElementType, isCollectionInstance } from './get.base';
import { getInstanceInteractionFields, getActionInstanceFields } from './utils';
import { getCollectionItemInstance } from './utils.collection';
import { isCollectionWithItemBaseElement, isCollectionWithItemFragment, getCollectionType } from './utils.collection';

const {
  resultActionsMap,
  baseElementsActionsDescription,
  baseLibraryDescription,
  collectionDescription,
  baseCollectionActionsDescription,
} = config.get();

function wrap(itemType) {
  return `Omit<${itemType}, '${collectionDescription.action}'>`;
}

function createType(itemObject: Array<{ [k: string]: { [k: string]: string } }> | { [k: string]: string }, action) {
  if (itemObject[action]) {
    return `${itemObject[action]}`;
  }

  const generatedTypeString = (itemObject as Array<{ [k: string]: { [k: string]: string } }>)
    .filter(item => item[Object.keys(item)[0]][action])
    .reduce((typeString, fieldDescriptor, index, initialArr) => {
      const field = Object.keys(fieldDescriptor)[0];

      return fieldDescriptor[field][action]
        ? typeString +
            (index === initialArr.length - 1
              ? `\n ${field}?: ${fieldDescriptor[field][action]}\n}`
              : `\n ${field}?: ${fieldDescriptor[field][action]}`)
        : typeString;
    }, '{');

  if (generatedTypeString === '{') {
    // TODO need to find a solution to make
    console.log('Issue, type generation does not handle properly ');

    return 'unknown';
  }

  return generatedTypeString;
}

function getColletionActionType(collectionsItem, getTypes, collectionActionType, ...rest) {
  let [collectionActionDescriptor] = rest;

  return Object.keys(collectionActionType).reduce((typeString, actionKey, index, allActions) => {
    const actionDescriptor = collectionActionType[actionKey] as { action: string; actionType: string };

    return `${typeString}${getTypes(
      collectionsItem,
      actionDescriptor.action,
      actionDescriptor.actionType,
      collectionActionDescriptor,
    )}${allActions.length - 1 === index ? '' : ','}`;
  }, '');
}

function getCollectionTypes(instance, action, actionType, ...rest) {
  let [collectionActionDescriptor, wrap] = rest;

  const collectionsItem = getCollectionItemInstance(instance);

  const getTypeHandler = baseElementsActionsDescription[collectionsItem.constructor.name]
    ? getElementType
    : getFragmentTypes;

  const checkActionHandler = baseElementsActionsDescription[collectionsItem.constructor.name]
    ? checkThatElementHasAction
    : checkThatInstanceHasActionItems;

  if (!checkActionHandler(collectionsItem, action)) {
    return '';
  }

  const types = {};
  collectionActionDescriptor = collectionActionDescriptor || baseCollectionActionsDescription[action][actionType];
  const { generic, endType, ...actionDescriptor } = collectionActionDescriptor;

  let colletionItemType = getColletionActionType(
    collectionsItem,
    getTypeHandler,
    actionDescriptor,
    collectionActionDescriptor,
  );

  if (generic) {
    colletionItemType = wrap ? wrap(`${generic}<${colletionItemType}>`) : `${generic}<${colletionItemType}>`;
  }
  if (endType) {
    colletionItemType = `${colletionItemType}${endType}`;
  }

  types[action] = colletionItemType;

  return types;
}

function getFragmentTypes(instance, action: string, actionType: string, ...rest) {
  if (resultActionsMap[action] === 'void' && actionType === 'resultType') return 'void';

  if (isCollectionInstance(instance)) {
    const types = getCollectionTypes(instance, action, actionType, ...rest);

    return createType(types, action);
  }

  const { fragmentFields, elementFields, collectionsFields } = getActionInstanceFields(instance, action);

  const fragmentElements = elementFields.map(itemFiledName => ({
    [itemFiledName]: { [action]: getElementType(instance[itemFiledName], action, actionType) },
  }));

  const fragmentFragments = fragmentFields.map(itemFiledName => ({
    [itemFiledName]: { [action]: getFragmentTypes(instance[itemFiledName], action, actionType, ...rest) },
  }));

  // TODO add possibility do run as collections
  const fragmentArrayItems = collectionsFields.map(itemFiledName => ({
    [itemFiledName]: {
      [action]: createType(getCollectionTypes(instance[itemFiledName], action, actionType, ...rest), action),
    },
  }));

  return createType([...fragmentElements, ...fragmentArrayItems, ...fragmentFragments], action);
}

function getElementsTypes(instance, action: string, actionType: string): string {
  if (resultActionsMap[action] === 'void' && actionType === 'resultType') return 'void';

  const instanceElements = getInstanceInteractionFields(instance)
    .filter(itemFiledName => checkThatElementHasAction(instance[itemFiledName], action))
    .map(itemFiledName => ({ [itemFiledName]: getElementActionType(instance[itemFiledName], action, actionType) }));

  return createType(Array.from(instanceElements), action);
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

export { createType, getFragmentTypes, getElementsTypes, getCollectionTypes, getCollectionsPathes };
