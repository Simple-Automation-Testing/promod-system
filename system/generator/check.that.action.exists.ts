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
import { getFragmentTypes } from './get.instance.elements.type';

function getCollectionsPathes(instance) {
  const { baseElementsActionsDescription, baseLibraryDescription, collectionDescription } = config.get();

  if (isCollectionWithItemBaseElement(instance)) {
    return {
      [collectionDescription.action]: null,
      __countResult: getElementType(getCollectionItemInstance(instance), 'get', 'resultType'),
      __visible: getElementType(getCollectionItemInstance(instance), '_visible', 'resultType'),
      __where: getElementType(getCollectionItemInstance(instance), '_where', 'resultType'),
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
        __visible: getFragmentTypes(collectionInstance, '_visible', 'resultType'),
        __where: getFragmentTypes(collectionInstance, '_where', 'resultType'),
        _fields: getFragmentInteractionFields(collectionInstance),
      };
    } else if (isCollectionWithItemBaseElement(instance[fragmentChildFieldName])) {
      const collectionInstance = getCollectionItemInstance(instance[fragmentChildFieldName]);

      result[fragmentChildFieldName] = {
        [collectionDescription.action]: null,

        __countResult: getElementType(collectionInstance, 'get', 'resultType'),
        __visible: getElementType(collectionInstance, '_visible', 'resultType'),
        __where: getElementType(collectionInstance, '_where', 'resultType'),
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
