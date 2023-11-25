/* eslint-disable sonarjs/no-identical-functions */
/* eslint-disable sonarjs/no-nested-template-literals, complexity, sonarjs/cognitive-complexity */
import {
  prettifyCamelCase,
  isEmptyObject,
  isArray,
  isUndefined,
  isNull,
  isObject,
  toArray,
  isPrimitive,
  isString,
  isNumber,
  compareToPattern,
} from 'sat-utils';
import { config } from '../config';

const { collectionDescription = {} } = config.get();

const stringifyBase = base => {
  return Object.keys(base).reduce((descriptor, key, index, { length }) => {
    if (isNull(base[key])) {
      return `${descriptor}${key}${''}${index === length - 1 ? '' : ', '}`;
    }

    const checkNumber = isString(base[key]) && compareToPattern.checkThatCheckNumber(base[key]);
    const dataIncludes = isString(base[key]) && compareToPattern.checkThatDataIncludes(base[key]);
    const patternIncludes = isString(base[key]) && compareToPattern.checkThatPatternIncludes(base[key]);
    const dataLowercase = isString(base[key]) && compareToPattern.checkThatDataLowercase(base[key]);
    const dataUppercase = isString(base[key]) && compareToPattern.checkThatDataUppercase(base[key]);
    const patternLowercase = isString(base[key]) && compareToPattern.checkThatPatternLowercase(base[key]);
    const patternUppercase = isString(base[key]) && compareToPattern.checkThatPatternUppercase(base[key]);

    if (checkNumber) {
      const data = compareToPattern.removeCheckNumberId(base[key]).trim();

      return `${descriptor}${key} value should follow expression "${data}"${index === length - 1 ? '' : ', '}`;
    }

    if (dataIncludes) {
      const data = compareToPattern.removeDataIncludesId(base[key]).trim();
      return `${descriptor}${key} value should include "${data}" ${index === length - 1 ? '' : ', '}`;
    }

    if (patternIncludes) {
      const data = compareToPattern.removePatternIncludesId(base[key]).trim();
      return `${descriptor}${key} "${data}" should include value from element${index === length - 1 ? '' : ', '}`;
    }

    if (dataLowercase) {
      const data = compareToPattern.removeDataLowercase(base[key]).trim();
      return `${descriptor}${key} should equal to "${data}" in lower case${index === length - 1 ? '' : ', '}`;
    }

    if (dataUppercase) {
      const data = compareToPattern.removeDataUppercase(base[key]).trim();
      return `${descriptor}${key} should equal to "${data}" in upper case${index === length - 1 ? '' : ', '}`;
    }

    if (patternLowercase) {
      const data = compareToPattern.removePatternLowercase(base[key]).trim();
      return `${descriptor}${key} should equal to "${data}" which is lowercased value${
        index === length - 1 ? '' : ', '
      }`;
    }

    if (patternUppercase) {
      const data = compareToPattern.removePatternUppercase(base[key]).trim();
      return `${descriptor}${key} should equal to "${data}" which is uppercased value${
        index === length - 1 ? '' : ', '
      }`;
    }

    return `${descriptor}${key}${` - "${base[key]}"`}${index === length - 1 ? '' : ', '}`;
  }, '');
};

const isBase = keys => {
  const { baseResultData } = config.get();

  if (isArray(keys)) {
    return keys.some(key => baseResultData.includes(key));
  } else if (isObject(keys) && Object.keys(keys).every(k => isPrimitive(keys[k]))) {
    return isBase(Object.keys(keys));
  }

  return false;
};

const getIntexesMessage = (indexes: number | number[]) =>
  toArray(indexes).length
    ? ` where ${toArray(indexes).length === 1 ? 'index is' : 'indexes are'} ${toArray(indexes).join(',')} `
    : '';

function getDescriptorMessage(descriptorObj, initialMessage = ' where ', description = 'state') {
  if (isString(descriptorObj) || isNumber(descriptorObj)) {
    return `'${String(descriptorObj)}' ${initialMessage}`;
  }

  const {
    [collectionDescription.index]: index,
    [collectionDescription.count]: count,
    ...restDescription
  } = descriptorObj || {};

  const collectionDescriptionMessagePart = Object.values(collectionDescription as { [k: string]: string }).reduce(
    (description, descriptorKey) => {
      if (!isUndefined(restDescription[descriptorKey])) {
        description[descriptorKey] = restDescription[descriptorKey];
      }

      return description;
    },
    {},
  );

  const descriptionMessage = Object.keys(collectionDescriptionMessagePart).reduce((description, descriptorKey) => {
    return `${description}${getDescriptorMessage(
      restDescription[descriptorKey],
      ` ${prettifyCamelCase(descriptorKey.replace(/[^\da-z]/gi, '')).toLowerCase()} collection `,
    )}`;
  }, '');

  const restDataMessagePart = Object.keys(restDescription as { [k: string]: any })
    .filter(restDescriptionKey => !Object.values(collectionDescription).includes(restDescriptionKey))
    .reduce((description, descriptorKey) => {
      if (!isUndefined(restDescription[descriptorKey])) {
        description[descriptorKey] = restDescription[descriptorKey];
      }

      return description;
    }, {});

  if (isEmptyObject(restDataMessagePart)) {
    return descriptionMessage;
  } else {
    descriptorObj = restDataMessagePart;
  }

  if (isUndefined(descriptorObj) || isNull(descriptorObj)) {
    return '';
  }

  if (isPrimitive(descriptorObj)) {
    return `${descriptionMessage} ${initialMessage} ${description} '${String(descriptorObj)}'`;
  }

  if (isBase(Object.keys(descriptorObj))) {
    return `${descriptionMessage} ${initialMessage} ${description} '${stringifyBase(descriptorObj)}' exists`;
  }

  const result = Object.keys(descriptorObj).reduce((contentMessage, key, index, keys) => {
    const postFix = isObject(descriptorObj[key]) && !isBase(Object.keys(descriptorObj[key])) ? ' item ' : ' ';
    const startAction = contentMessage
      ? `${contentMessage} '${key}'${postFix}has ${description} `
      : `element '${key}'${postFix}has ${description} `;

    if (Object.values(collectionDescription).includes(key)) {
      return getDescriptorMessage(descriptorObj[key], initialMessage, `${description} '${key}'`);
    }

    const isLastKey = keys.length - 1 === index;
    const messageEnd = isLastKey ? '' : ' and ';

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
  }, initialMessage.trim());

  return `${descriptionMessage} ${result}`;
}

const doesArgumentHaveCollection = (obj: { [k: string]: any }) => {
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

const isActionableAction = (actionFlow: string) => {
  const { prettyMethodName = {} } = config.get();
  const { action, click, sendKeys } = prettyMethodName;

  const actionableActions = [action, click, sendKeys].filter(Boolean);

  return actionableActions.some(prettyAction => actionFlow.includes(prettyAction));
};

const getWaitingOptionsPrettyMessage = (waitingOptions?: { [key: string]: any }) => {
  if (!isObject(waitingOptions)) return '';
  /** @info sat-utils compareToPattern */
  const { everyArrayItem, stringIncludes, isEql } = waitingOptions;
  let waitingMessage = '\n';

  waitingMessage =
    everyArrayItem === false
      ? `${waitingMessage} one or more collection elements should include required state\n`
      : `${waitingMessage} all collection elements should include required state\n`;

  waitingMessage =
    stringIncludes === false
      ? `${waitingMessage} string should include part of the string`
      : `${waitingMessage} string should equal to string`;

  waitingMessage =
    isEql === false ? `${waitingMessage}\n expected that condition result should be negative` : waitingMessage;

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
  isActionableAction,
};
