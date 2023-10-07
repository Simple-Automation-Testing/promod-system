/* eslint-disable no-console */
import { config } from '../config/config';

const { baseLibraryDescription, baseElementsActionsDescription } = config.get();

function getCollectionItemInstance(collectionInstance) {
  let collectionRoot;
  if (!collectionInstance[baseLibraryDescription.rootLocatorId]) {
    console.error('baseLibraryDescription should have rootLocatorId, default locator will be "a"');
    collectionRoot = 'a';
  } else {
    collectionRoot = collectionInstance[baseLibraryDescription.rootLocatorId] || 'a';
  }

  if (!collectionInstance[baseLibraryDescription.collectionItemId]) {
    throw new TypeError(`baseLibraryDescription should have collectionItemId, i.e
// collection class
class Collection {
  constructor(locator, collectionName, rootElements, InstanceType) {
    this.rootLocator = locator;
    this.identifier = collectionName;
    this.rootElements = rootElements;
    this.CollectionItemClass = CollectionItemClass;
  }
}
// promod.system.config.js
const baseLibraryDescription = {
  // ...rest description
  collectionItemId: 'CollectionItemClass'
}
`);
  }

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
