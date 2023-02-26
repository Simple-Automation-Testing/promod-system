/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable unicorn/consistent-function-scoping */
import {
  isUndefined,
  isEmptyObject,
  isEmptyArray,
  isNotEmptyObject,
  isNull,
  safeJSONstringify,
  isObject,
  camelize,
  safeHasOwnPropery,
  compareToPattern,
} from 'sat-utils';
import { config } from '../config/config';
import { getCollectionsPathes } from './check.that.action.exists';

const descriptionKeys = ['__countResult', '__visible', '__where'];

function removeKeys(data, keysPath) {
  const [first, ...rest] = keysPath.split('.');

  if (isEmptyArray(rest)) {
    delete data[first];
  } else {
    const part = removeKeys(data[first], rest.join('.'));

    if (
      (isNotEmptyObject(part) && compareToPattern(Object.keys(part).sort(), descriptionKeys.sort()).result) ||
      isEmptyObject(part) ||
      isEmptyArray(part) ||
      isNull(part) ||
      isUndefined(part)
    ) {
      delete data[first];
    } else {
      data[first] = part;
    }
  }

  return data;
}

function getKeyFormat(dataItem) {
  const { collectionDescription } = config.get();
  for (const key of Object.keys(dataItem).filter(k => !descriptionKeys.includes(k))) {
    const isActionInside = safeJSONstringify(dataItem[key]).includes(collectionDescription.action);
    const isDescription = descriptionKeys.every(k => safeHasOwnPropery(dataItem[key], k));

    if (key === collectionDescription.action && (isNull(dataItem[key]) || !isActionInside)) {
      const { __countResult, __visible, __where } = dataItem;

      return { [collectionDescription.action]: null, __countResult, __visible, __where };
    } else if (isObject(dataItem[key]) && !isActionInside && isDescription) {
      const { __countResult, __visible, __where } = dataItem[key];

      return { [key]: { [collectionDescription.action]: null }, __countResult, __visible, __where };
    } else if (isObject(dataItem[key])) {
      const { __countResult, __visible, __where, ...rest } = getKeyFormat(dataItem[key]);
      return { [key]: rest, __countResult, __visible, __where };
    }
  }
}

function getSanitizeDataKeys(sanitizePattern) {
  let pathKeys = '';

  const firstKey = Object.keys(sanitizePattern).find(k => !descriptionKeys.includes(k));

  if (isNull(sanitizePattern[firstKey])) {
    pathKeys = firstKey;
  } else if (isObject(sanitizePattern[firstKey])) {
    pathKeys = `${firstKey}.${getSanitizeDataKeys(sanitizePattern[firstKey])}`;
  } else {
    throw new Error(`Something is wrong`);
  }

  return pathKeys;
}

function getActionsList(data) {
  const { collectionDescription } = config.get();

  const actions = [];

  while (isNotEmptyObject(data) && safeJSONstringify(data).includes(collectionDescription.action)) {
    for (const key of Object.keys(data)) {
      const { __countResult, __visible, __where, ...result } = getKeyFormat(data[key]);

      const action = { [key]: result };

      data = removeKeys(data, getSanitizeDataKeys(action));

      actions.push({ action, __countResult, __visible, __where });
    }
  }

  return actions;
}

function getResult(data, flat?) {
  const { collectionDescription } = config.get();
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

function getName(data) {
  const { collectionDescription } = config.get();

  return Object.keys(data).reduce((pattern, key) => {
    if (key === collectionDescription.action) {
      return `${pattern}${isObject(data[key]) ? getName(data[key]) : ''}`;
    }

    return `${pattern} ${key}${isObject(data[key]) ? getName(data[key]) : key}`;
  }, '');
}

function createTemplate(asActorAndPage, actionDescriptor) {
  const { baseLibraryDescription, collectionDescription } = config.get();
  const { action, __countResult, __visible, __where } = actionDescriptor;

  const result = getResult(action);
  const name = camelize(`${asActorAndPage} Get Collection From ${getName(action)}`);

  const actionSignature = safeJSONstringify(action).replace(
    `"${collectionDescription.action}": null`,
    // TODO this approach should be improved
    `...descriptions, ${collectionDescription.action}: null`,
  );

  return `
  type T${name}Entry = {
    _whereNot?: ${__where || 'any'}
    _where?: ${__where || 'any'}
    _visible?: ${__visible || 'any'}
  }
  type T${name} = ${__countResult}
  const ${name} = async function({...descriptions}: T${name}Entry = {}): Promise<T${name}[]> {
    const result = await page.${baseLibraryDescription.getDataMethod}(${actionSignature});

    return result.${result}
  }`;
}

function getCountFlows(pageInstance, asActorAndPage) {
  const data = getCollectionsPathes(pageInstance);

  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    return `${flows}\n${createTemplate(asActorAndPage, dataObject)}`;
  }, '');
}

export { getActionsList, getResult, getCountFlows };
