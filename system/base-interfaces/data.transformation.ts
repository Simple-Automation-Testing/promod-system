/* eslint-disable sonarjs/cognitive-complexity */
import { safeHasOwnPropery, isObject, isUndefined, isEmptyObject, isNotEmptyObject, isNotEmptyArray } from 'sat-utils';
import { config } from '../config';
import { getCollectionElementInstance, getCollectionActionData } from './utils';
import { isCollectionInstance } from '../generator/utils.collection';

import { promodLogger } from '../logger';

function getCollectionRecomposedData(recomposedData, component) {
  promodLogger.promodSystem(`[PROMOD SYSTEM DATA] recomposition of the collection data: `, recomposedData, component);

  if (!recomposedData) return recomposedData;

  const { collectionDescription, baseLibraryDescription } = config.get();

  if (isUndefined(collectionDescription) || isUndefined(baseLibraryDescription)) {
    throw new ReferenceError('promod.system.config should have `baseLibraryDescription` and `collectionDescription`');
  }

  const collectionActionProps = new Set(Object.values(collectionDescription).filter(key => key !== 'length'));

  /**
   * !@info
   * length is a part of the array and should be ignored during action recomposition
   * [collectionDescription.comparison]
   */
  const { length, [collectionDescription.comparison]: ignoreComparison, ...rest } = recomposedData;

  for (const key of Object.keys(rest)) {
    if (
      isCollectionInstance(component && component[key]) &&
      !collectionActionProps.has(key) &&
      !safeHasOwnPropery(rest[key], collectionDescription.action)
    ) {
      const itemsArrayChild = getCollectionElementInstance(component && component[key], baseLibraryDescription);
      const {
        _outOfDescription,
        [collectionDescription.comparison]: ignoreComparison,
        ...data
      } = getCollectionActionData(rest[key], collectionDescription);

      if (isEmptyObject(_outOfDescription) && isNotEmptyArray(ignoreComparison)) {
        rest[key] = {
          ...data,
          [collectionDescription.action]: getCollectionRecomposedData(ignoreComparison[0], itemsArrayChild),
        };
      } else if (isEmptyObject(_outOfDescription) && isNotEmptyObject(ignoreComparison)) {
        rest[key] = {
          ...data,
          [collectionDescription.action]: getCollectionRecomposedData(ignoreComparison, itemsArrayChild),
        };
      } else if (isNotEmptyArray(_outOfDescription)) {
        rest[key] = {
          ...data,
          [collectionDescription.action]: getCollectionRecomposedData(_outOfDescription[0], itemsArrayChild),
        };
      } else {
        rest[key] = {
          ...data,
          [collectionDescription.action]: getCollectionRecomposedData(_outOfDescription, itemsArrayChild),
        };
      }
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
