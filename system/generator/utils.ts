/* eslint-disable unicorn/no-object-as-default-parameter */
import { config } from '../config/config';
import { checkThatElementHasAction, isBaseElement } from './get.base';
import { checkThatInstanceHasActionItems } from './check.that.action.exists';
import { isCollectionInstance } from './utils.collection';

const { baseElementsActionsDescription, baseLibraryDescription } = config.get();

function getAllBaseActions() {
  return Array.from(
    new Set(
      Object.keys(baseElementsActionsDescription).flatMap(element =>
        Object.keys(baseElementsActionsDescription[element]),
      ),
    ).values(),
  );
}

type TgetInstanceInteractionFieldsOpts = {
  all?: boolean;
  elements?: boolean;
  fragments?: boolean;
  collections?: boolean;
  fragmentsAndElments?: boolean;
  fragmentsAndCollections?: boolean;
  elementsAndCollections?: boolean;
};
function getInstanceInteractionFields(
  instance: { [k: string]: any },
  opts: TgetInstanceInteractionFieldsOpts = { all: true },
) {
  const {
    all,
    elements,
    fragments,
    collections,
    fragmentsAndElments,
    fragmentsAndCollections,
    elementsAndCollections,
  } = opts;
  const instanceOwnKeys = Object.getOwnPropertyNames(instance);

  const elementsList = Object.keys(baseElementsActionsDescription);
  const baseInterfaces = [baseLibraryDescription.fragmentId, baseLibraryDescription.collectionId];

  return instanceOwnKeys.filter(item => {
    const fieldConstructorName: string = instance[item]?.constructor?.name;
    if (all) {
      return (
        elementsList.includes(fieldConstructorName) ||
        baseInterfaces.some(baseInterface => fieldConstructorName?.endsWith(baseInterface))
      );
    }
    if (fragmentsAndElments) {
      return (
        elementsList.includes(fieldConstructorName) || fieldConstructorName?.endsWith(baseLibraryDescription.fragmentId)
      );
    }
    if (fragmentsAndCollections) {
      return baseInterfaces.some(baseInterface => fieldConstructorName?.endsWith(baseInterface));
    }
    if (elementsAndCollections) {
      return (
        elementsList.includes(fieldConstructorName) ||
        fieldConstructorName?.endsWith(baseLibraryDescription.collectionId)
      );
    }
    if (elements) {
      return elementsList.includes(fieldConstructorName);
    }
    if (fragments) {
      return fieldConstructorName?.endsWith(baseLibraryDescription.fragmentId);
    }
    if (collections) {
      return fieldConstructorName?.endsWith(baseLibraryDescription.collectionId);
    }
  });
}

function getInstanceFragmentAndElementFields(instance, action: string) {
  const interactionFields = getInstanceInteractionFields(instance);

  const elementFields = interactionFields.filter(field => checkThatElementHasAction(instance[field], action));

  const fragmentFields = interactionFields.filter(
    field =>
      !isBaseElement(instance[field]) &&
      !isCollectionInstance(instance[field]) &&
      checkThatInstanceHasActionItems(instance[field], action),
  );

  const collectionsFields = interactionFields.filter(
    field => isCollectionInstance(instance[field]) && checkThatInstanceHasActionItems(instance[field], action),
  );

  return { elementFields, fragmentFields, collectionsFields };
}

export { getAllBaseActions, getInstanceInteractionFields, getInstanceFragmentAndElementFields };
