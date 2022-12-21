/* eslint-disable complexity, sonarjs/cognitive-complexity */
import { isArray, isUndefined, isNull, isObject, toArray, isPrimitive } from 'sat-utils';
import { config } from '../config';

const stringifyBase = base =>
  Object.keys(base).reduce(
    (descriptor, key, index, { length }) => `${descriptor}${key} - ${base[key]}${index === length - 1 ? '' : ', '}`,
    '',
  );

const isBase = keys => {
  const { baseResultData } = config.get();
  if (isArray(keys)) {
    return keys.some(key => baseResultData.includes(key));
  } else if (isObject(keys)) {
    return isBase(Object.keys(keys));
  }

  return false;
};

const getIntexesMessage = (indexes: number | number[]) =>
  toArray(indexes).length
    ? ` where ${toArray(indexes).length === 1 ? 'index is' : 'indexes are'} ${toArray(indexes).join(',')} `
    : '';

const getDescriptorMessage = (descriptorObj, initialMessage = ' where collection ', description = 'state') => {
  if (isUndefined(descriptorObj) || isNull(descriptorObj)) {
    return '';
  }

  if (isPrimitive(descriptorObj)) {
    return `${initialMessage} ${description} '${descriptorObj}'`;
  }

  if (isBase(Object.keys(descriptorObj))) {
    return ` where ${description} '${stringifyBase(descriptorObj)}' exists`;
  }

  return Object.keys(descriptorObj).reduce((contentMessage, key, index, keys) => {
    const postFix = isObject(descriptorObj[key]) && !isBase(Object.keys(descriptorObj[key])) ? ' item ' : ' ';
    const isLastKey = keys.length - 1 === index;
    const messageEnd = isLastKey ? '' : ' and ';

    const startAction = contentMessage
      ? `${contentMessage}'${key}'${postFix}has ${description} `
      : `element '${key}'${postFix}has ${description} `;

    if (isLastKey && isPrimitive(descriptorObj[key])) {
      return `${startAction}'${descriptorObj[key]}'`;
    }

    if (isObject(descriptorObj[key]) && isBase(Object.keys(descriptorObj[key]))) {
      return `${startAction}'${stringifyBase(descriptorObj[key])}'${messageEnd}`;
    }

    if (isObject(descriptorObj[key]) && !isBase(Object.keys(descriptorObj[key]))) {
      return `${startAction}${getDescriptorMessage(descriptorObj[key], '', description)}${messageEnd}`;
    }

    return contentMessage;
  }, initialMessage);
};

const doesArgumentHaveCollection = (obj: { [k: string]: any }) => {
  const { collectionDescription = {} } = config.get();
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

const isPropValueCollection = (propValue: { [k: string]: any }, action, propName?: string) => {
  const { collectionDescription = {} } = config.get();
  const { collectionPropsId, ...collectionProps } = collectionDescription;

  if (propName && collectionPropsId && propName.endsWith(collectionPropsId)) {
    return true;
  }

  return (
    isObject(propValue) && Object.values(collectionProps).some((prop: string) => Object.keys(propValue).includes(prop))
  );
};

const isPropValuesRandomCollectionItem = (propValue: { [k: string]: any }, action) => {
  const { prettyMethodName = {} } = config.get();
  // TODO move to config in case if it will be configurable
  const randomDataFields = ['except', 'like', 'field', '_where', '_whereNot', '_visible'];

  // TODO move to config in case if it will be configurable
  return (
    prettyMethodName?.getRandom?.includes(action) ||
    (isObject(propValue) && randomDataFields.some((prop: string) => Object.keys(propValue).includes(prop)))
  );
};

const isActionableAction = (actionFlow: string) => {
  const { prettyMethodName = {} } = config.get();
  const { action, click, sendKeys } = prettyMethodName;

  const actionableActions = [action, click, sendKeys].filter(Boolean);

  return actionableActions.some(prettyAction => actionFlow.includes(prettyAction));
};

const getWaitingOptionsPrettyMessage = (waitingOptions?: { [key: string]: any }) => {
  if (!isObject(waitingOptions)) return '';
  /** @info sat-utils compareToPattern */
  const { everyArrayItem, stringIncludes } = waitingOptions;
  let waitingMessage = '\n';

  waitingMessage =
    everyArrayItem === false
      ? `${waitingMessage} one or more collection elements should include required state\n`
      : `${waitingMessage} all collection elements should include required state\n`;

  waitingMessage =
    stringIncludes === false
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
  isPropValuesRandomCollectionItem,
  isActionableAction,
};
