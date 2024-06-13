/* eslint-disable no-console */
import { config } from '../config/config';

const { baseLibraryDescription, baseElementsActionsDescription } = config.get();

function getCollectionItemInstance(collectionInstance) {
  if (!baseLibraryDescription.getCollectionItemInstance) {
    throw new Error('"getCollectionItemInstance" is not defined in baseLibraryDescription');
  }
  if (collectionInstance[baseLibraryDescription.getCollectionItemInstance]) {
    throw new Error(
      `collection should have "${baseLibraryDescription.getCollectionItemInstance}" method that returns collection item instance`,
    );
  }
  return collectionInstance[baseLibraryDescription.getCollectionItemInstance]();
}

function isCollectionInstance(instance) {
  return instance?.constructor?.name?.includes(baseLibraryDescription.collectionId);
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

export {
  getCollectionItemInstance,
  isCollectionWithItemBaseElement,
  isCollectionWithItemFragment,
  isCollectionInstance,
};
