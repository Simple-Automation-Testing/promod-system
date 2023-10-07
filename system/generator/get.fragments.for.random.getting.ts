/* eslint-disable sonarjs/cognitive-complexity, no-console*/

// TODO how to handle collection in collection
import { isNotEmptyObject } from 'sat-utils';
import { config } from '../config/config';
import { getElementsTypes } from './get.instance.elements.type';
import { getInstanceInteractionFields } from './utils';
import { checkThatElementHasAction, getElementType, isBaseElement, getFragmentBaseElementsFields } from './get.base';
import {
  getCollectionItemInstance,
  isCollectionWithItemBaseElement,
  isCollectionWithItemFragment,
} from './utils.collection';

function getCollectionItemTypes(collectionItemInstance) {
  const { collectionRandomDataDescription } = config.get();

  const getType = isBaseElement(collectionItemInstance) ? getElementType : getElementsTypes;

  const _fields = getInstanceInteractionFields(collectionItemInstance);

  const types = Object.keys(collectionRandomDataDescription).reduce((description, key) => {
    description[key] = getType(
      collectionItemInstance,
      collectionRandomDataDescription[key].action,
      collectionRandomDataDescription[key].actionType,
    );

    return description;
  }, {});

  return { _fields, ...types };
}

function getPathesToCollections(childInstance, name) {
  const { baseLibraryDescription } = config.get();

  function getPathToListIfExists(instance) {
    const pathes = {};

    if (isCollectionWithItemBaseElement(instance) || isCollectionWithItemFragment(instance)) {
      return getCollectionItemTypes(getCollectionItemInstance(instance));
    }

    const interactionFields = getInstanceInteractionFields(instance);

    for (const field of interactionFields) {
      const childConstructorName = instance[field].constructor.name;

      if (childConstructorName.includes(baseLibraryDescription.fragmentId)) {
        const result = getPathToListIfExists(instance[field]);

        if (isNotEmptyObject(result)) {
          pathes[field] = result;
        }
      } else if (
        (isCollectionWithItemFragment(instance[field]) &&
          getFragmentBaseElementsFields(getCollectionItemInstance(instance[field])).length) ||
        (isCollectionWithItemBaseElement(instance[field]) &&
          checkThatElementHasAction(getCollectionItemInstance(instance[field]), baseLibraryDescription.getDataMethod))
      ) {
        const collectionItemInstance = getCollectionItemInstance(instance[field]);

        pathes[field] = getCollectionItemTypes(collectionItemInstance);
      }
    }

    return pathes;
  }

  const result = getPathToListIfExists(childInstance);

  if (isNotEmptyObject(result)) return { [name]: result };
}

export { getPathesToCollections };
