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
} from 'sat-utils';
import { config } from '../config/config';
import { getCollectionsPathes } from './check.that.action.exists';

function removeKeys(data, keysPath) {
  const [first, ...rest] = keysPath.split('.');
  let typeItem;

  if (isEmptyArray(rest)) {
    delete data[first];
  } else {
    const { withoutProps: part, temp } = removeKeys(data[first], rest.join('.'));

    typeItem = temp;

    if (
      isEmptyObject(part) ||
      isEmptyArray(part) ||
      isNull(part) ||
      isUndefined(part) ||
      (Object.keys(part).length === 1 && Object.keys(part)[0] === '__temp')
    ) {
      if (part.__temp) {
        typeItem = part.__temp;
      }
      delete data[first];
    } else {
      data[first] = part;
    }
  }

  return { withoutProps: data, temp: typeItem };
}

function getActionsList(data) {
  const { collectionDescription } = config.get();

  const actions = [];

  function getKeyFormat(dataItem) {
    for (const key of Object.keys(dataItem).filter(k => k !== '__temp')) {
      if (
        key === collectionDescription.action &&
        (isNull(dataItem[key]) || !safeJSONstringify(dataItem[key]).includes(collectionDescription.action))
      ) {
        return { [collectionDescription.action]: null };
      } else if (isObject(dataItem[key])) {
        return { [key]: getKeyFormat(dataItem[key]) };
      }
    }
  }

  function getSanitizeDataKeys(sanitizePattern) {
    let pathKeys = '';

    const firstKey = Object.keys(sanitizePattern).find(k => k !== '__temp');

    if (isNull(sanitizePattern[firstKey])) {
      pathKeys = firstKey;
    } else if (isObject(sanitizePattern[firstKey])) {
      pathKeys = `${firstKey}.${getSanitizeDataKeys(sanitizePattern[firstKey])}`;
    } else {
      throw new Error(`Something is wrong`);
    }

    return pathKeys;
  }

  while (isNotEmptyObject(data) && safeJSONstringify(data).includes(collectionDescription.action)) {
    for (const key of Object.keys(data)) {
      const result = getKeyFormat(data[key]);

      const action = { [key]: result };
      const { withoutProps, temp } = removeKeys(data, getSanitizeDataKeys(action));

      data = withoutProps;

      actions.push({ action, typeResult: temp });
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
  const { baseLibraryDescription } = config.get();
  const { typeResult, action } = actionDescriptor;
  const result = getResult(action);
  const name = camelize(`${asActorAndPage} Get Collection From ${getName(action)}`);

  return `
  type T${name} = ${typeResult}
  const ${name} = async function(): Promise<T${name}[]> {
    const result = await page.${baseLibraryDescription.getDataMethod}(${safeJSONstringify(action)});

    return result.${result}
  }`;
}

function getCountFlows(pageInstance, asActorAndPage) {
  const data = getCollectionsPathes(pageInstance);

  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    return `${flows}${createTemplate(asActorAndPage, dataObject)}`;
  }, '');
}

export { getActionsList, getResult, getCountFlows };
