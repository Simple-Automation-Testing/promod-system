/* eslint-disable sonarjs/cognitive-complexity, no-console*/
// TODO how to handle collection in collection
import { isNotEmptyObject } from 'sat-utils';

import { config } from '../config/config';

import { getElementsTypes } from './create.type';
import { getInstanceInteractionFields } from './utils';
import {
  checkThatElementHasAction,
  getElementType,
  isBaseElementInstance,
  getFragmentBaseElementsFields,
} from './get.base';
import {
  getCollectionItemInstance,
  isCollectionWithItemBaseElement,
  isCollectionWithItemFragment,
} from './utils.collection';

const { collectionRandomDataDescription, baseLibraryDescription } = config.get();

function getCollectionItemTypes(collectionItemInstance) {
  const getType = isBaseElementInstance(collectionItemInstance) ? getElementType : getElementsTypes;

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
          checkThatElementHasAction(
            getCollectionItemInstance(instance[field])?.constructor?.name,
            baseLibraryDescription.getDataMethod,
          ))
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
