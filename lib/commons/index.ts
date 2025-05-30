/* eslint-disable sonarjs/cognitive-complexity */
import {
  safeHasOwnPropery,
  isObject,
  isUndefined,
  isEmptyObject,
  isNotEmptyObject,
  isNotEmptyArray,
  safeJSONstringify,
  isPrimitive,
} from 'sat-utils';
import { config } from '../config';
import { isCollectionInstance } from '../generator/get.base';

import { promodLogger } from '../logger';

const { collectionDescription, baseLibraryDescription } = config.get();

type TCollectionAction = {
  [key: string]: string;
};
/**
 * @example config
 * const config = {
 *   action: '_action',
 *   where: '_where',
 *   repeatActionForEveryFoundElement: '_forAll',
 *   reversFoundElementCollection: '_reverse',
 *   whereNot: '_whereNot',
 *   visible: '_visible',
 *   index: '_indexes',
 *   count: '_count',
 *   length: 'length',
 * };
 */
function getCollectionActionData(
  dataObj,
  collectionDescription: TCollectionAction,
): { [k: string]: any; _outOfDescription: any } {
  if (Array.isArray(dataObj)) {
    return { _outOfDescription: dataObj };
  }

  const copied = { ...dataObj };

  /**
   * !@info - remove array length and collection comparison object or array
   */
  delete copied.length;

  const data: any = {};

  Object.values(collectionDescription).forEach(key => {
    data[key] = copied[key];
    delete copied[key];
  });

  data['_outOfDescription'] = copied;

  return data;
}

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
    if (isCollectionInstance(component && component[key]) && !collectionActionProps.has(key)) {
      const actionDescription = safeHasOwnPropery(rest[key], collectionDescription.action)
        ? rest[key][collectionDescription.action]
        : undefined;
      const itemsArrayChild = component[key][baseLibraryDescription.getCollectionItemInstance](0);

      const {
        _outOfDescription,
        [collectionDescription.comparison]: ignoreComparison,
        ...data
      } = getCollectionActionData(rest[key], collectionDescription);

      if (isEmptyObject(_outOfDescription) && isNotEmptyArray(ignoreComparison)) {
        rest[key] = {
          ...data,
          [collectionDescription.action]: isUndefined(actionDescription)
            ? getCollectionRecomposedData(ignoreComparison[0], itemsArrayChild)
            : actionDescription,
        };
      } else if (isEmptyObject(_outOfDescription) && isNotEmptyObject(ignoreComparison)) {
        rest[key] = {
          ...data,
          [collectionDescription.action]: isUndefined(actionDescription)
            ? getCollectionRecomposedData(ignoreComparison, itemsArrayChild)
            : actionDescription,
        };
      } else if (isNotEmptyArray(_outOfDescription)) {
        rest[key] = {
          ...data,
          [collectionDescription.action]: isUndefined(actionDescription)
            ? getCollectionRecomposedData(_outOfDescription[0], itemsArrayChild)
            : actionDescription,
        };
      } else {
        rest[key] = {
          ...data,
          [collectionDescription.action]: isUndefined(actionDescription)
            ? getCollectionRecomposedData(_outOfDescription, itemsArrayChild)
            : actionDescription,
        };
      }
    } else if (isObject(rest[key]) && !collectionActionProps.has(key)) {
      rest[key] = getCollectionRecomposedData(rest[key], component && component[key]);
    } else if (collectionActionProps.has(key) && !isPrimitive(rest[key])) {
      rest[key] = { ...rest[key] };
    } else if (collectionActionProps.has(key) && isPrimitive(rest[key])) {
      rest[key] = rest[key];
    } else {
      rest[key] = null;
    }
  }

  return rest;
}

export { getCollectionRecomposedData, getActionDescriptorsFilledData };
