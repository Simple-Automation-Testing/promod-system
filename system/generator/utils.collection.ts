import { config } from '../config/config';

function getCollectionItemInstance(collectionInstance) {
  const { baseLibraryDescription } = config.get();

  const collectionRoot = collectionInstance[baseLibraryDescription.rootLocatorId] || 'a';

  const instance = new collectionInstance[baseLibraryDescription.collectionItemId](
    collectionRoot,
    collectionInstance[baseLibraryDescription.entityId],
    collectionInstance[baseLibraryDescription.collectionRootElementsId][
      baseLibraryDescription.getBaseElementFromCollectionByIndex
    ](0),
  );

  instance[baseLibraryDescription.entityId] = collectionInstance[baseLibraryDescription.entityId];
  instance[baseLibraryDescription.rootLocatorId] = collectionInstance[baseLibraryDescription.rootLocatorId];
  instance[baseLibraryDescription.collectionRootElementsId] =
    collectionInstance[baseLibraryDescription.collectionRootElementsId][
      baseLibraryDescription.getBaseElementFromCollectionByIndex
    ](0);
  return instance;
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
