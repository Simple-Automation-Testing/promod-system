/* eslint-disable complexity, sonarjs/cognitive-complexity */
import { isObject, toArray, isPrimitive } from 'sat-utils';
import { config } from '../config';

const stringifyBase = base =>
  Object.keys(base).reduce(
    (descriptor, key, index, { length }) => `${descriptor}${key} - ${base[key]}${index === length - 1 ? '' : ', '}`,
    '',
  );

const isBase = keys => {
  const { baseResultData } = config.get();
  return keys.some(key => baseResultData.includes(key));
};

const getIntexesMessage = indexes =>
  toArray(indexes).length
    ? ` where ${toArray(indexes).length === 1 ? 'index is' : 'indexes are'} ${toArray(indexes).join(',')}`
    : '';

const getDescriptorMessage = (descriptorObj, initialMessage = ' where collection ', description = 'state') => {
  if (!descriptorObj) {
    return '';
  }
  if (isBase(Object.keys(descriptorObj))) {
    return ` where ${description} '${stringifyBase(descriptorObj)}' exists`;
  }

  return Object.keys(descriptorObj).reduce((contentMessage, key, index, keys) => {
    const postFix = isObject(descriptorObj[key]) && !isBase(Object.keys(descriptorObj[key])) ? ' item ' : ' ';

    const startAction = contentMessage
      ? `${contentMessage}'${key}'${postFix}has ${description} `
      : `element '${key}'${postFix}has ${description} `;

    if (keys.length - 1 === index && isPrimitive(descriptorObj[key])) {
      return `${startAction}'${descriptorObj[key]}'`;
    }

    if (keys.length - 1 === index && isObject(descriptorObj[key]) && isBase(Object.keys(descriptorObj[key]))) {
      return `${startAction}'${stringifyBase(descriptorObj[key])}'`;
    }

    if (isObject(descriptorObj[key]) && isBase(Object.keys(descriptorObj[key]))) {
      return `${startAction}'${stringifyBase(descriptorObj[key])}' and `;
    }

    if (isObject(descriptorObj[key]) && keys.length - 1 !== index && !isBase(Object.keys(descriptorObj[key]))) {
      return `${startAction}${getDescriptorMessage(descriptorObj[key], '', description)} and `;
    }

    if (isObject(descriptorObj[key]) && keys.length - 1 === index && !isBase(Object.keys(descriptorObj[key]))) {
      return `${startAction}${getDescriptorMessage(descriptorObj[key], '', description)}`;
    }

    return contentMessage;
  }, initialMessage);
};

const doesArgumentHaveCollection = obj => {
  const { collectionDescription } = config.get();
  const { collectionPropsId, ...collectionProps } = collectionDescription;

  return Object.keys(obj).some(key => {
    if (collectionPropsId && key.endsWith(collectionPropsId)) {
      return true;
    }

    if (Object.values(collectionProps).length && Object.values(collectionProps).includes(key)) {
      return true;
    }

    if (isObject(obj[key])) {
      return doesArgumentHaveCollection(obj[key]);
    }

    return false;
  });
};

const isPropValueCollection = (propName: string, propValue: { [k: string]: any }) => {
  const { collectionDescription } = config.get();
  const { collectionPropsId, ...collectionProps } = collectionDescription;

  if (collectionPropsId && propName.endsWith(collectionPropsId)) {
    return true;
  }

  return (
    isObject(propValue) && Object.values(collectionProps).some((prop: string) => Object.keys(propValue).includes(prop))
  );
};

const getWaitingOptionsPrettyMessage = (waitingOptions?: { [key: string]: any }) => {
  if (!isObject(waitingOptions)) return '';
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
