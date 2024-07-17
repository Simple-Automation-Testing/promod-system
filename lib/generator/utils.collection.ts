/* eslint-disable no-console */
import { config } from '../config/config';
import { isCollectionInstance } from './get.base';

const { baseLibraryDescription, baseElementsActionsDescription } = config.get();

function getCollectionItemInstance(collectionInstance) {
  if (!baseLibraryDescription.getCollectionItemInstance) {
    throw new Error('"getCollectionItemInstance" is not defined in baseLibraryDescription');
  }
  if (!collectionInstance[baseLibraryDescription.getCollectionItemInstance]) {
    throw new Error(
      `collection should have "${baseLibraryDescription.getCollectionItemInstance}" method that returns collection item instance`,
    );
  }
  return collectionInstance[baseLibraryDescription.getCollectionItemInstance]();
}

function isCollectionWithItemBaseElement(instance) {
  return (
    isCollectionInstance(instance) &&
    baseElementsActionsDescription[instance[baseLibraryDescription.collectionItemId]?.name]
  );
}

function isCollectionWithItemFragment(instance) {
  return (
    isCollectionInstance(instance) &&
    instance[baseLibraryDescription.collectionItemId].name.includes(baseLibraryDescription.fragmentId)
  );
}

function getCollectionType(instance) {
  if (!isCollectionInstance(instance)) {
    return { fragment: false, element: false };
  }

  return {
    fragment: isCollectionWithItemFragment(instance),
    element: isCollectionWithItemBaseElement(instance),
  };
}

export { getCollectionItemInstance, isCollectionWithItemBaseElement, isCollectionWithItemFragment, getCollectionType };
