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

function isCollectionWithItemBaseElement(instance) {
  const { baseLibraryDescription, baseElementsActionsDescription } = config.get();

  return !!(
    instance?.constructor?.name.includes(baseLibraryDescription.collectionId) &&
    baseElementsActionsDescription[instance[baseLibraryDescription.collectionItemId]?.name]
  );
}

function isCollectionWithItemFragment(instance) {
  const { baseLibraryDescription } = config.get();

  return (
    instance?.constructor?.name.includes(baseLibraryDescription.collectionId) &&
    instance[baseLibraryDescription.collectionItemId].name.includes(baseLibraryDescription.fragmentId)
  );
}

export { getCollectionItemInstance, isCollectionWithItemBaseElement, isCollectionWithItemFragment };
