/* eslint-disable sonarjs/cognitive-complexity */
import {
  isUndefined,
  compareToPattern,
  isNull,
  isNotEmptyObject,
  isEmptyObject,
  safeJSONstringify,
  safeHasOwnPropery,
  isObject,
  isEmptyArray,
} from 'sat-utils';
import { config } from '../config/config';

// TODO refactor
const descriptionKeys = ['__countResult', '_type', '_fields'];
const { collectionRandomDataDescription, collectionDescription = { action: '_action' } } = config.get();

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
    const isActionInside = safeJSONstringify(dataItem[key]).includes(collectionDescription.action);
    const isDescription = descriptionKeys.every(k => safeHasOwnPropery(dataItem[key], k));

    if (key === collectionDescription.action && (isNull(dataItem[key]) || !isActionInside)) {
      const { __countResult, _type, _fields } = dataItem;

      return { [collectionDescription.action]: null, __countResult, _type, _fields };
    } else if (isObject(dataItem[key]) && !isActionInside && isDescription) {
      const { __countResult, _type, _fields } = dataItem[key];

      return { [key]: { [collectionDescription.action]: null }, __countResult, _type, _fields };
    } else if (isNotEmptyObject(dataItem[key]) && isActionInside) {
      const { __countResult, _type, _fields, ...rest } = getKeyFormat(dataItem[key]);
      return { [key]: rest, __countResult, _type, _fields };
    }
  }

  return dataItem;
}

function getSanitizeDataKeys(sanitizePattern) {
  let pathKeys = '';

  const firstKey = Object.keys(sanitizePattern).find(k => !descriptionKeys.includes(k));

  if (isNull(sanitizePattern[firstKey])) {
    pathKeys = firstKey;
  } else if (isNotEmptyObject(sanitizePattern[firstKey])) {
    pathKeys = `${firstKey}.${getSanitizeDataKeys(sanitizePattern[firstKey])}`;
  } else {
    throw new Error(`Something is wrong`);
  }

  return pathKeys;
}

function removeKeys(data: { [k: string]: any }, keysPath: string) {
  const [first, ...rest] = keysPath.split('.');

  if (isEmptyArray(rest)) {
    delete data[first];
  } else {
    const part = removeKeys(data[first], rest.join('.'));

    if (isNotEmptyObject(part) && compareToPattern(Object.keys(part).sort(), descriptionKeys.sort()).result) {
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
   * @info it is possible that some wrapping is done and we need to make sure
   * that collection action key is wrapped in default JSON double quotes
   */
  while (isNotEmptyObject(data) && safeJSONstringify(data).includes(`"${collectionDescription.action}"`)) {
    for (const key of Object.keys(data).filter(k =>
      safeJSONstringify(data[k]).includes(`"${collectionDescription.action}"`),
    )) {
      const { __countResult, _type, _fields, ...result } = getKeyFormat(data[key]);
      const action = { [key]: result };

      data = removeKeys(data, getSanitizeDataKeys(action));

      actions.push({ action, __countResult, _type, _fields });
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

    if (
      key === collectionDescription.action &&
      !safeJSONstringify(data[key]).includes(collectionDescription.action) &&
      flat
    ) {
      return `${pattern}map(item => item)`;
    }

    if (
      key === collectionDescription.action &&
      !safeJSONstringify(data[key]).includes(collectionDescription.action) &&
      !flat
    ) {
      return `${pattern}`;
    }

    if (key === collectionDescription.action && safeJSONstringify(data[key]).includes(collectionDescription.action)) {
      return `${pattern}flatMap((item) => item.${getResult(data[key], true)})`;
    }

    return pattern;
  }, '');
}

function getResultMappedResult(result, data, flat?) {
  const firstKey = Object.keys(data)[0];

  if (
    firstKey === collectionDescription.action &&
    safeJSONstringify(data[firstKey]).includes(collectionDescription.action)
  ) {
    return result.flatMap(item => getResultMappedResult(item, data[firstKey], true));
  }

  if (
    firstKey === collectionDescription.action &&
    !safeJSONstringify(data[firstKey]).includes(collectionDescription.action) &&
    flat
  ) {
    return result.map(item => item);
  }

  if (
    firstKey === collectionDescription.action &&
    !safeJSONstringify(data[firstKey]).includes(collectionDescription.action) &&
    !flat
  ) {
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

function addDescriptions(descriptions, action) {
  const firstKey = Object.keys(action)[0];

  if (firstKey === collectionDescription.action && action[firstKey] === null) {
    return { ...descriptions, [collectionDescription.action]: null };
  }

  return { [firstKey]: addDescriptions(descriptions, action[firstKey]) };
}

function getName(data) {
  return Object.keys(data).reduce((pattern, key) => {
    if (key === collectionDescription.action) {
      return `${pattern}${isObject(data[key]) ? getName(data[key]) : ''}`;
    }

    return `${pattern} ${key}${isObject(data[key]) ? getName(data[key]) : key}`;
  }, '');
}

function getFieldsEnumList(fieldsArr: string[]) {
  return fieldsArr.reduce((enumList, item, index, arr) => {
    const separator = index === arr.length - 1 ? '' : '|';
    return `${enumList} '${item}' ${separator}`;
  }, '');
}

export {
  isCollectionDescription,
  toRandomTemplateFormat,
  findTypedObject,
  getActionsList,
  getResult,
  getResultMappedResult,
  getName,
  getFieldsEnumList,
  getSanitizeDataKeys,
  getKeyFormat,
  addDescriptions,
};
