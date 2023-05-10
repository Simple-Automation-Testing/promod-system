import { config } from '../config/config';

function getCollectionItemInstance(collectionInstance) {
  const { baseLibraryDescription } = config.get();

  return new collectionInstance[baseLibraryDescription.collectionItemId](
    collectionInstance[baseLibraryDescription.rootLocatorId],
    collectionInstance[baseLibraryDescription.entityId],
    collectionInstance[baseLibraryDescription.collectionRootElementsId][
      baseLibraryDescription.getBaseElementFromCollectionByIndex
    ](0),
  );
}

function isCollectionInstance(instance) {
  const { baseLibraryDescription } = config.get();

  return instance?.constructor?.name?.includes(baseLibraryDescription.collectionId);
}

function isCollectionWithItemBaseElement(instance) {
  const { baseLibraryDescription, baseElementsActionsDescription } = config.get();

  return (
    isCollectionInstance(instance) &&
    baseElementsActionsDescription[instance[baseLibraryDescription.collectionItemId]?.name]
  );
}

function isCollectionWithItemFragment(instance) {
  const { baseLibraryDescription } = config.get();

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
