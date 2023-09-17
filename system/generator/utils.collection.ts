import { config } from '../config/config';

const { baseLibraryDescription, baseElementsActionsDescription } = config.get();

function getCollectionItemInstance(collectionInstance) {
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
