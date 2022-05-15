/* eslint-disable complexity */
import { isObject, prettifyCamelCase, toArray, isArray, isPrimitive } from 'sat-utils';
import { getConfiguration } from './config';

const stringifyBase = base =>
  Object.keys(base).reduce(
    (descriptor, key, index, { length }) => `${descriptor}${key} - ${base[key]}${index === length - 1 ? '' : ', '}`,
    '',
  );

const isBase = keys => {
  const { baseResultData } = getConfiguration();
  return keys.some(key => baseResultData.includes(key));
};

const getIntexesMessage = indexes =>
  toArray(indexes).length
    ? ` where ${toArray(indexes).length === 1 ? 'index is' : 'indexes are'} ${toArray(indexes).join(',')}`
    : '';

const getDescriptorMessage = (descriptorObj, initialMessage = ' where ') => {
  if (!descriptorObj) {
    return '';
  }
  if (isBase(Object.keys(descriptorObj))) {
    return ` where element has state ${stringifyBase(descriptorObj)}`;
  }

  return Object.keys(descriptorObj).reduce((contentMessage, key, index, keys) => {
    const startAction = contentMessage ? `${contentMessage} element has state ` : 'element has state ';

    if (keys.length - 1 === index && isPrimitive(descriptorObj[key])) {
      return `${startAction}'${prettifyCamelCase(key)}' element has state ${descriptorObj[key]}`;
    }

    if (keys.length - 1 === index && isObject(descriptorObj[key]) && isBase(Object.keys(descriptorObj[key]))) {
      return `${startAction}'${prettifyCamelCase(key)}' element has state ${stringifyBase(descriptorObj[key])}`;
    }

    if (isObject(descriptorObj[key]) && isBase(Object.keys(descriptorObj[key]))) {
      return `${startAction}'${prettifyCamelCase(key)}' element has state ${stringifyBase(descriptorObj[key])} and `;
    }

    if (isObject(descriptorObj[key]) && !isBase(Object.keys(descriptorObj[key])) && keys.length - 1 !== index) {
      return `${startAction}fragment elements ${getDescriptorMessage(descriptorObj[key], contentMessage)} and `;
    }

    if (isObject(descriptorObj[key]) && keys.length - 1 === index && !isBase(Object.keys(descriptorObj[key]))) {
      return `${startAction}'${prettifyCamelCase(key)}' fragment elements ${getDescriptorMessage(
        descriptorObj[key],
        contentMessage,
      )}`;
    }

    return contentMessage;
  }, initialMessage);
};

const doesArgumentHaveCollection = obj => {
  const { collectionDescription } = getConfiguration();
  const { collectionPropsId, ...collectionProps } = collectionDescription;

  return Object.keys(obj).some(key => {
    if (collectionPropsId && key.endsWith(collectionPropsId)) {
      return true;
    }

    if (Object.values(collectionProps).length && Object.values(collectionProps).some(prop => prop === key)) {
      return true;
    }

    if (isObject(obj[key])) {
      return doesArgumentHaveCollection(obj[key]);
    }

    return false;
  });
};

const isPropValueCollection = (propName: string, propValue: { [k: string]: any }) => {
  const { collectionDescription } = getConfiguration();
  const { collectionPropsId, collectionProps } = collectionDescription;

  if (collectionPropsId && propName.endsWith(collectionPropsId)) {
    return true;
  }

  if (
    isArray(collectionProps) &&
    collectionProps.some(prop => Object.keys(propValue).some(propValueProp => propValueProp === prop))
  ) {
    return true;
  }

  return false;
};

const getWaitingOptionsPrettyMessage = (waitingOptions?: { [key: string]: any }) => {
  if (!waitingOptions) return '';
  /** @info sat-utils compareToPattern */
  const { strictArrays, strictStrings } = waitingOptions;
  let waitingMessage = '\n';

  waitingMessage =
    strictArrays === false
      ? `${waitingMessage} one or more collection elements should include required state\n`
      : `${waitingMessage} all collection elements should include required state\n`;

  waitingMessage =
    strictStrings === false
      ? `${waitingMessage} string should include part of the string`
      : `${waitingMessage} string should equal to string`;

  return waitingMessage;
};

export {
  isBase,
  stringifyBase,
  getDescriptorMessage,
  getIntexesMessage,
  doesArgumentHaveCollection,
  getWaitingOptionsPrettyMessage,
  isPropValueCollection,
};
