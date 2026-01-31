/* eslint-disable no-console, sonarjs/cognitive-complexity */
import {
  isUndefined,
  isNull,
  isNotEmptyObject,
  isEmptyObject,
  safeJSONstringify,
  safeHasOwnPropery,
  isObject,
  isEmptyArray,
} from 'sat-utils';
import { compare } from 'sat-compare';
import { config } from '../config/config';

// TODO refactor
const descriptionKeys = ['_countResult', '_type', '_fields', '_check'];

const { collectionRandomDataDescription, collectionDescription = { action: '_action' } } = config.get();

/**
 * Recursively checks if a key exists anywhere in the object tree.
 * More efficient than JSON.stringify().includes() for key presence checks.
 */
function hasKeyDeep(obj: unknown, targetKey: string): boolean {
  if (!isObject(obj) || obj === null) {
    return false;
  }

  for (const key of Object.keys(obj)) {
    if (key === targetKey) {
      return true;
    }
    if (hasKeyDeep(obj[key], targetKey)) {
      return true;
    }
  }

  return false;
}

function isCollectionDescription(data) {
  return isNotEmptyObject(data) && Object.keys(collectionRandomDataDescription).some(key => key in data);
}

function toRandomTemplateFormat(dataItem) {
  const items = [];

  function push(item) {
    items.push(item);
  }

  function iterate(item, entry = 0) {
    let obj = {};

    if (isCollectionDescription(item)) {
      return item;
    }

    for (const key of Object.keys(item)) {
      if (isCollectionDescription(item[key])) {
        obj[key] = { ...item[key] };
        delete item[key];
        return obj;
      } else if (isEmptyObject(item[key])) {
        delete item[key];
      } else {
        if (entry === 0 && isNotEmptyObject(obj)) {
          push(obj);
          obj = {};
        }

        const nestedResult = iterate(item[key], 1);

        if (entry === 0 && isNotEmptyObject(nestedResult)) {
          obj[key] = nestedResult;
          push(obj);
          obj = {};
        } else if (isNotEmptyObject(nestedResult)) {
          obj[key] = nestedResult;
          return obj;
        }

        if (isEmptyObject(item[key])) {
          delete item[key];
        }
      }

      return {};
    }
  }

  do {
    iterate(dataItem);
  } while (isNotEmptyObject(dataItem) && !isCollectionDescription(dataItem));

  return items.filter(item => isNotEmptyObject(item));
}

function findTypedObject(dataObj) {
  for (const value of Object.values(dataObj)) {
    return isCollectionDescription(value) ? value : findTypedObject(value);
  }
}

function getKeyFormat(dataItem) {
  for (const key of Object.keys(dataItem).filter(k => !descriptionKeys.includes(k))) {
    const isActionInside = hasKeyDeep(dataItem[key], collectionDescription.action);
    const isDescription = descriptionKeys.every(k => safeHasOwnPropery(dataItem[key], k));

    if (key === collectionDescription.action && (isNull(dataItem[key]) || !isActionInside)) {
      const { _countResult, _type, _fields, _check } = dataItem;

      return { [collectionDescription.action]: null, _countResult, _type, _fields, _check };
    } else if (isObject(dataItem[key]) && !isActionInside && isDescription) {
      const { _countResult, _type, _fields, _check } = dataItem[key];

      return {
        [key]: { [collectionDescription.action]: null },
        _countResult,
        _type,
        _fields,
        _check,
      };
    } else if (isNotEmptyObject(dataItem[key]) && isActionInside) {
      const { _countResult, _type, _fields, _check, ...rest } = getKeyFormat(dataItem[key]);
      return { [key]: rest, _countResult, _type, _fields, _check };
    }
  }

  return dataItem;
}

/**
 * Extracts the dot-separated key path from a sanitize pattern.
 * Used to identify which keys should be removed from the data structure.
 */
function getSanitizeDataKeys(sanitizePattern: { [k: string]: any }): string {
  const firstKey = Object.keys(sanitizePattern).find(k => !descriptionKeys.includes(k));

  if (!firstKey) {
    throw new Error(
      `No valid key found in sanitize pattern. ` +
        `Pattern contains only description keys: ${safeJSONstringify(sanitizePattern)}`,
    );
  }

  if (isNull(sanitizePattern[firstKey])) {
    return firstKey;
  }

  if (isNotEmptyObject(sanitizePattern[firstKey])) {
    return `${firstKey}.${getSanitizeDataKeys(sanitizePattern[firstKey])}`;
  }

  throw new Error(
    `Invalid sanitize pattern structure. Key '${firstKey}' has unexpected value type. ` +
      `Expected null or non-empty object, got: ${safeJSONstringify(sanitizePattern[firstKey])}`,
  );
}

function removeKeys(data: { [k: string]: any }, keysPath: string) {
  const [first, ...rest] = keysPath.split('.');

  if (isEmptyArray(rest)) {
    delete data[first];
  } else {
    const part = removeKeys(data[first], rest.join('.'));

    if (isNotEmptyObject(part) && compare(Object.keys(part).sort(), descriptionKeys.sort()).result) {
      // TODO this should be improved
      data[first] = {};
    } else if (isEmptyObject(part) || isEmptyArray(part) || isNull(part) || isUndefined(part)) {
      delete data[first];
    } else {
      data[first] = part;
    }
  }

  return data;
}

function getActionsList(data) {
  const actions = [];

  /**
   * @info check if the collection action key exists anywhere in the data tree
   */
  while (isNotEmptyObject(data) && hasKeyDeep(data, collectionDescription.action)) {
    for (const key of Object.keys(data).filter(k => hasKeyDeep(data[k], collectionDescription.action))) {
      const { _countResult, _type, _fields, _check, ...result } = getKeyFormat(data[key]);
      const action = { [key]: result };

      try {
        data = removeKeys(data, getSanitizeDataKeys(action));

        actions.push({ action, _countResult, _type, _check, _fields });
      } catch (error) {
        console.error(`Key ${key}, data ${safeJSONstringify(data)}, action ${safeJSONstringify(action)}`);

        throw error;
      }
    }
  }

  return actions;
}

function getResult(data, flat?) {
  return Object.keys(data).reduce((pattern, key) => {
    if (key !== collectionDescription.action) {
      const result = getResult(data[key], flat);
      const next = result.length ? `.${result}` : result;
      return `${key}${next}`;
    }

    if (key === collectionDescription.action && !hasKeyDeep(data[key], collectionDescription.action) && flat) {
      return `${pattern}map(item => item)`;
    }

    if (key === collectionDescription.action && !hasKeyDeep(data[key], collectionDescription.action) && !flat) {
      return `${pattern}`;
    }

    if (key === collectionDescription.action && hasKeyDeep(data[key], collectionDescription.action)) {
      return `${pattern}flatMap((item) => item.${getResult(data[key], true)})`;
    }

    return pattern;
  }, '');
}

function getResultMappedResult(result, data, flat?) {
  const firstKey = Object.keys(data)[0];

  if (firstKey === collectionDescription.action && hasKeyDeep(data[firstKey], collectionDescription.action)) {
    return result.flatMap(item => getResultMappedResult(item, data[firstKey], true));
  }

  if (firstKey === collectionDescription.action && !hasKeyDeep(data[firstKey], collectionDescription.action) && flat) {
    return result.map(item => item);
  }

  if (firstKey === collectionDescription.action && !hasKeyDeep(data[firstKey], collectionDescription.action) && !flat) {
    return result;
  }

  if (firstKey !== collectionDescription.action) {
    const res = result[firstKey];
    if (data[firstKey] === null) {
      return res;
    }
    return getResultMappedResult(res, data[firstKey], true);
  }
}

function addDescriptions(descriptions, action, actionData = null) {
  const firstKey = Object.keys(action)[0];

  if (firstKey === collectionDescription.action && action[firstKey] === null) {
    return { ...descriptions, [collectionDescription.action]: actionData };
  }

  return { [firstKey]: addDescriptions(descriptions, action[firstKey], actionData) };
}

function addWaitingBasedOnAction(descriptions, action) {
  const actionKey = Object.keys(action).find(k => k === collectionDescription.action);

  const notActionsProps = Object.keys(action)
    .filter(k => k !== collectionDescription.action)
    .reduce((acc, key) => {
      acc[key] = addWaitingBasedOnAction(descriptions, action[key]);
      return acc;
    }, {});

  const actionProps = actionKey ? action[actionKey] : {};

  return { ...actionProps, ...notActionsProps, ...(actionKey ? descriptions : {}) };
}

function getFieldsEnumList(fieldsArr: string[]) {
  return fieldsArr.reduce((enumList, item, index, arr) => {
    const separator = index === arr.length - 1 ? '' : '|';
    return `${enumList} '${item}' ${separator}`;
  }, '');
}

export {
  hasKeyDeep,
  isCollectionDescription,
  toRandomTemplateFormat,
  findTypedObject,
  getActionsList,
  getResult,
  getResultMappedResult,
  getFieldsEnumList,
  getSanitizeDataKeys,
  getKeyFormat,
  addDescriptions,
  addWaitingBasedOnAction,
};
