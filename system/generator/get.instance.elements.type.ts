/* eslint-disable unicorn/prefer-switch, no-use-before-define, sonarjs/cognitive-complexity */
import { createType } from './create.type';
import { config } from '../config/config';
import { checkThatInstanceHasActionItems } from './check.that.action.exists';
import { checkThatElementHasAction, getElementActionType, getElementType } from './get.base';
import { getInstanceInteractionFields, getInstanceFragmentAndElementFields } from './utils';
import { getCollectionItemInstance } from './utils.collection';

const { resultActionsMap, baseLibraryDescription, baseCollectionActionsDescription, baseElementsActionsDescription } =
  config.get();

function getColletionActionType(collectionsItem, getTypes, collectionActionType, ...rest) {
  let [collectionActionDescriptor] = rest;
  return Object.keys(collectionActionType).reduce((typeString, actionKey, index, allActions) => {
    const actionDescriptor = collectionActionType[actionKey] as { action: string; actionType: string };

    if (allActions.length - 1 === index) {
      return (typeString += `${getTypes(
        collectionsItem,
        actionDescriptor.action,
        actionDescriptor.actionType,
        collectionActionDescriptor,
      )}`);
    }

    return (typeString += `${getTypes(
      collectionsItem,
      actionDescriptor.action,
      actionDescriptor.actionType,
      collectionActionDescriptor,
    )},`);
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

  if (instance.constructor.name === baseLibraryDescription.collectionId) {
    const types = getCollectionTypes(instance, action, actionType, ...rest);

    return createType(types, action);
  }

  const { fragmentFields, elementFields, collectionsFields } = getInstanceFragmentAndElementFields(instance, action);

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

export { getCollectionTypes, getFragmentTypes, getElementsTypes };
