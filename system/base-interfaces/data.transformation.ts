/* eslint-disable sonarjs/cognitive-complexity */
import {
  safeHasOwnPropery,
  isObject,
  isUndefined,
  isEmptyObject,
  isNotEmptyObject,
  isNotEmptyArray,
  safeJSONstringify,
} from 'sat-utils';
import { config } from '../config';
import { getCollectionElementInstance, getCollectionActionData } from './utils';
import { isCollectionInstance } from '../generator/utils.collection';

import { promodLogger } from '../logger';

const { collectionDescription, baseLibraryDescription } = config.get();

function getActionDescriptorsFilledData(item, getNestedKey?) {
  promodLogger.promodSystem(`[PROMOD SYSTEM DATA] filled data: `, item, getNestedKey);
  if (isUndefined(collectionDescription)) {
    throw new ReferenceError('promod.system.config should have `collectionDescription`');
  }

  const collectionNestedDesciption = [
    collectionDescription.where,
    collectionDescription.whereNot,
    collectionDescription.visible,
  ].filter(Boolean);
  // if item is not an object we do not need to iterate
  if (!isObject(item)) {
    return item;
  }
  // if item does not have collection like properties - we do not need to iterate
  if (!safeJSONstringify(item).includes(collectionDescription.action)) {
    return item;
  }

  const keys = Object.keys(item);
  const actionalable = keys.find(k => k === collectionDescription.action);

  if (keys.some(k => collectionNestedDesciption.includes(k)) && getNestedKey) {
    return keys
      .filter(k => collectionNestedDesciption.includes(k))
      .reduce((descriptors, key) => {
        descriptors[key] = item[key];

        return descriptors;
      }, {})[getNestedKey];
  }

  // actionable key was found but any nested descriptors there
  if (actionalable && collectionNestedDesciption.every(k => !safeJSONstringify(item[actionalable]).includes(k))) {
    return item;
  }

  const upDescription = {};
  const descriptors = actionalable
    ? collectionNestedDesciption.filter(k => safeJSONstringify(item[actionalable]).includes(k) && !keys.includes(k))
    : [];

  if (actionalable && descriptors.length) {
    descriptors.forEach(k => {
      upDescription[k] = getActionDescriptorsFilledData(item[actionalable], k);
    });

    return { ...upDescription, ...item };
  } else {
    for (const k of keys) {
      const res = getActionDescriptorsFilledData(item[k]);
      Object.assign(upDescription, { [k]: res });
    }
  }

  return upDescription;
}

function getCollectionRecomposedData(recomposedData, component) {
  promodLogger.promodSystem(`[PROMOD SYSTEM DATA] recomposition of the collection data: `, recomposedData, component);

  if (!recomposedData) return recomposedData;

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

export { getCollectionRecomposedData, getActionDescriptorsFilledData };
