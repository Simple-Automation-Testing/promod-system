/* eslint-disable sonarjs/cognitive-complexity */
import { safeHasOwnPropery, isObject, isUndefined, isEmptyObject, isNotEmptyObject, isNotEmptyArray } from 'sat-utils';
import { config } from '../config';
import { getCollectionElementInstance, getCollectionActionData } from './utils';
import { isCollectionInstance } from '../generator/get.base';

import { promodLogger } from '../logger';

function getCollectionRecomposedData(recomposedData, component) {
  promodLogger.promodSystem(`[PROMOD SYSTEM DATA] recomposition of the collection data: `, recomposedData, component);

  if (!recomposedData) return recomposedData;

  const { collectionDescription, baseLibraryDescription } = config.get();

  if (isUndefined(collectionDescription) || isUndefined(baseLibraryDescription)) {
    throw new ReferenceError('promod.system.config should have `baseLibraryDescription` and `collectionDescription`');
  }

  const collectionActionProps = new Set(Object.values(collectionDescription).filter(key => key !== 'length'));

  const { length, [collectionDescription.comparison]: ignoreComparison, ...rest } = recomposedData;

  for (const key of Object.keys(rest)) {
    rest[key] = processKey(
      rest[key],
      key,
      component,
      collectionActionProps,
      collectionDescription,
      baseLibraryDescription,
    );
  }

  return rest;
}

function processKey(value, key, component, collectionActionProps, collectionDescription, baseLibraryDescription) {
  if (
    isCollectionInstance(component && component[key]) &&
    !collectionActionProps.has(key) &&
    !safeHasOwnPropery(value, collectionDescription.action)
  ) {
    return processCollectionInstance(value, key, component, collectionDescription, baseLibraryDescription);
  } else if (isObject(value) && !collectionActionProps.has(key)) {
    return getCollectionRecomposedData(value, component && component[key]);
  } else if (collectionActionProps.has(key)) {
    return { ...value };
  } else {
    return null;
  }
}

function processCollectionInstance(value, key, component, collectionDescription, baseLibraryDescription) {
  const itemsArrayChild = getCollectionElementInstance(component && component[key], baseLibraryDescription);
  const {
    _outOfDescription,
    [collectionDescription.comparison]: ignoreComparison,
    ...data
  } = getCollectionActionData(value, collectionDescription);

  if (isEmptyObject(_outOfDescription) && isNotEmptyArray(ignoreComparison)) {
    return {
      ...data,
      [collectionDescription.action]: getCollectionRecomposedData(ignoreComparison[0], itemsArrayChild),
    };
  } else if (isEmptyObject(_outOfDescription) && isNotEmptyObject(ignoreComparison)) {
    return {
      ...data,
      [collectionDescription.action]: getCollectionRecomposedData(ignoreComparison, itemsArrayChild),
    };
  } else if (isNotEmptyArray(_outOfDescription)) {
    return {
      ...data,
      [collectionDescription.action]: getCollectionRecomposedData(_outOfDescription[0], itemsArrayChild),
    };
  } else {
    return {
      ...data,
      [collectionDescription.action]: getCollectionRecomposedData(_outOfDescription, itemsArrayChild),
    };
  }
}

export { getCollectionRecomposedData };
