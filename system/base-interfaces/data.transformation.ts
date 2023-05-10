import { safeHasOwnPropery, isObject } from 'sat-utils';
import { config } from '../config';
import { getCollectionElementInstance, getCollectionActionData } from './utils';
import { isCollectionInstance } from '../generator/utils.collection';

function getCollectionRecomposedData(recomposedData, component) {
  if (!recomposedData) return recomposedData;

  const { collectionDescription, baseLibraryDescription } = config.get();

  const collectionActionProps = new Set(Object.values(collectionDescription).filter(key => key !== 'length'));
  const { length, ...rest } = recomposedData;

  for (const key of Object.keys(rest)) {
    if (
      isCollectionInstance(component && component[key]) &&
      !collectionActionProps.has(key) &&
      !safeHasOwnPropery(rest[key], collectionDescription.action)
    ) {
      const itemsArrayChild = getCollectionElementInstance(component && component[key], baseLibraryDescription);
      const { _outOfDescription, ...data } = getCollectionActionData(rest[key], collectionDescription);

      rest[key] = {
        ...data,
        [collectionDescription.action]: getCollectionRecomposedData(_outOfDescription, itemsArrayChild),
      };
    } else if (isObject(rest[key]) && !collectionActionProps.has(key)) {
      rest[key] = getCollectionRecomposedData(rest[key], component && component[key]);
    } else if (collectionActionProps.has(key)) {
      rest[key] = { ...rest[key] };
    } else {
      rest[key] = null;
    }
  }

  return rest;
}

export { getCollectionRecomposedData };
