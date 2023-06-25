/* eslint-disable no-console, complexity, sonarjs/cognitive-complexity, sonarjs/no-identical-functions*/
import {
  isNotEmptyObject,
  isUndefined,
  isFunction,
  toArray,
  isArray,
  isString,
  isObject,
  prettifyCamelCase,
  isNull,
  isPrimitive,
} from 'sat-utils';

import {
  isBase,
  stringifyBase,
  getIntexesMessage,
  getDescriptorMessage,
  isPropValueCollection,
  getWaitingOptionsPrettyMessage,
} from './base';
import { config } from '../config';

const { warn, log } = console;

const {
  collectionDescription,
  actionFormatter = (action: string, ..._rest) => {
    warn('actionFormatter is not defined in promod.system.config.js, it is required for better messages');

    return action;
  },
  isWaitingAction = () => {
    warn('actionFormatter is not defined in promod.system.config.js, it is required for better messages');

    return false;
  },
} = config.get();

const updateActionSignature = isFunction(actionFormatter) ? actionFormatter : (action: string, ..._rest) => action;

function getFieldsEnumList(fieldsArr: string[]) {
  return fieldsArr.reduce((enumList, item, index, arr) => {
    const separator = index === arr.length - 1 ? '' : ',';
    return `${enumList} '${item}'${separator}`;
  }, '');
}

function collectionRandomDataDescriptionMessage(fileds: string | string[], data: { [k: string]: any }) {
  const { [collectionDescription.index]: index, [collectionDescription.count]: count, ...restDescription } = data || {};

  const fieldMessagePart = isArray(fileds) ? 'fields' : 'field';
  const filedsList = getFieldsEnumList(toArray(fileds));

  const descriptionMessage = Object.keys(restDescription).reduce(
    (description, key) => {
      return `${description}${getDescriptorMessage(
        restDescription[key],
        ` ${prettifyCamelCase(key.replace(/[^\da-z]/gi, '')).toLowerCase()} `,
      )}`;
    },
    Object.keys(restDescription).length ? `collection should have ` : '',
  );

  return `get random ${fieldMessagePart} ${filedsList} ${descriptionMessage}`;
}

function actionVisitor() {
  let isCalled = false;

  return () => {
    if (isCalled) {
      return false;
    } else {
      isCalled = true;
      return true;
    }
  };
}

function getActionMessage(action, isFirstCall, dataObj, initialMessage = '') {
  if (isBase(dataObj)) {
    return `${initialMessage} '${stringifyBase(dataObj)}'`;
  }

  if (isPropValueCollection(dataObj, action)) {
    return collectionDescriptionMessage(
      action,
      isFirstCall,
      dataObj,
      prettifyCamelCase(updateActionSignature(action, isFirstCall())),
    );
  }

  return Object.keys(dataObj).reduce((actionMessage, key, index, keys) => {
    const isLastKey = keys.length - 1 === index;
    const messageEnd = isLastKey ? '' : ' \n and then ';

    const formattedAction = updateActionSignature(action, isFirstCall());

    const formatedAction = prettifyCamelCase(formattedAction);

    const startAction = actionMessage ? `${actionMessage}${formatedAction.toLowerCase()}` : `${formatedAction}`;

    if (isPropValueCollection(dataObj[key], action, key)) {
      return collectionDescriptionMessage(action, isFirstCall, dataObj[key], startAction, key);
    }

    // TODO improve
    if (isNull(dataObj[key])) {
      return `${startAction} '${key}' element${messageEnd}`;
    }

    if (isPrimitive(dataObj[key])) {
      return `${startAction} '${key}' element '${dataObj[key]}' ${messageEnd}`;
    }

    if (isBase(dataObj[key])) {
      return `${startAction} '${key}' element '${stringifyBase(dataObj[key])}'${messageEnd}`;
    }

    if (isObject(dataObj[key])) {
      const startMessagePart = `${startAction} '${key}' fragment elements `;
      return `${getActionMessage(action, isFirstCall, dataObj[key], startMessagePart)}${messageEnd}`;
    }

    return actionMessage;
  }, `${initialMessage}\n`);
}

function getWaitingMessageForDataObj(
  action: string,
  isFirstCall: () => boolean,
  data: { [k: string]: any },
  startMessage: string,
  key?: string,
) {
  const {
    [collectionDescription.action]: collectionAction,
    [collectionDescription.index]: index,
    [collectionDescription.comparison]: toCompare,
    length,

    ...restDescription
  } = data;

  const collectionDescriptionMessagePart = Object.values(collectionDescription as { [k: string]: string }).reduce(
    (description, descriptorKey) => {
      if (!isUndefined(restDescription[descriptorKey])) {
        description[descriptorKey] = restDescription[descriptorKey];
      }

      return description;
    },
    {},
  );

  const collectionComparisonMessagePart = Object.keys(restDescription as { [k: string]: any })
    .filter(restDescriptionKey => !Object.values(collectionDescription).includes(restDescriptionKey))
    .reduce(
      (description, descriptorKey) => {
        if (!isUndefined(restDescription[descriptorKey])) {
          description[descriptorKey] = restDescription[descriptorKey];
        }

        return description;
      },
      isUndefined(length) ? {} : { length },
    );

  const collectionWaitStateMessagePart = [];

  if (isUndefined(toCompare)) {
    collectionWaitStateMessagePart.push(...toArray(collectionComparisonMessagePart));
  }

  if (!isUndefined(toCompare) && !isUndefined(length)) {
    collectionWaitStateMessagePart.push(...toArray(toCompare), { length });
  } else if (!isUndefined(toCompare)) {
    collectionWaitStateMessagePart.push(...toArray(toCompare));
  }

  const descriptionMessage = Object.keys(collectionDescriptionMessagePart).reduce((description, descriptorKey) => {
    return `${description}${getDescriptorMessage(
      restDescription[descriptorKey],
      ` ${prettifyCamelCase(descriptorKey.replace(/[^\da-z]/gi, '')).toLowerCase()} collection `,
    )}`;
  }, '');

  const indexesMessagePart = getIntexesMessage(index);

  console.log(collectionWaitStateMessagePart, '<>');

  const waitinStateMessage = collectionWaitStateMessagePart
    .filter(item => isNotEmptyObject(item))
    .map(item => `${getDescriptorMessage(item, ' \nwait')}`)
    .join(' and ');

  const actionMessage = isObject(collectionAction)
    ? ` required data for waiting comparison ${getActionMessage(action, isFirstCall, collectionAction)}`
    : '';
  const keyMessagePart = isString(key) ? `'${key}'` : '';

  return `${startMessage} ${keyMessagePart} collection items${actionMessage}${descriptionMessage} ${waitinStateMessage} ${indexesMessagePart} `;
}

function getWaitingMessage(
  action: string,
  isFirstCall: () => boolean,
  data: { [k: string]: any } | { [k: string]: any }[],
  startMessage: string,
  key?: string,
) {
  return toArray(data)
    .map(dataItem => getWaitingMessageForDataObj(action, isFirstCall, dataItem, startMessage, key))
    .join('\n');
}

function collectionDescriptionMessage(
  action: string,
  isFirstCall: () => boolean,
  data: { [k: string]: any },
  startMessage: string,
  key?: string,
) {
  if (isWaitingAction(action)) {
    return getWaitingMessage(action, isFirstCall, data, startMessage, key);
  }

  const {
    [collectionDescription.action]: collectionAction,
    [collectionDescription.index]: index,
    // TODO - add possibility to add count information
    [collectionDescription.count]: count,
    [collectionDescription.comparison]: toCompare,

    ...restDescription
  } = data;

  const actionMessage = isString(collectionAction) ? ` '${collectionAction}' collection item` : ' ';
  const keyMessagePart = isString(key) ? `'${key}'` : '';

  if (startMessage.endsWith(prettifyCamelCase(action).toLowerCase()) && isPrimitive(collectionAction)) {
    startMessage = startMessage.replace(
      new RegExp(`(${prettifyCamelCase(action).toLowerCase()})$`),
      updateActionSignature(action, isFirstCall()).toLowerCase(),
    );
  }

  const startMessagePart = `${startMessage} ${keyMessagePart} collection items ${actionMessage}  `;

  const descriptionMessage = Object.keys(restDescription).reduce((description, descriptorKey) => {
    return `${description}${getDescriptorMessage(
      restDescription[descriptorKey],
      ` ${prettifyCamelCase(descriptorKey.replace(/[^\da-z]/gi, '')).toLowerCase()} collection `,
    )}`;
  }, '');

  const indexesMessagePart = getIntexesMessage(index);

  const actionMessagePart = isObject(collectionAction)
    ? getActionMessage(
        action,
        isFirstCall,
        collectionAction,
        `${startMessagePart}${descriptionMessage}${indexesMessagePart}`,
      )
    : `${startMessagePart}${descriptionMessage}${indexesMessagePart}`;

  return `${actionMessagePart}`;
}

const getArgumentObjectMessage = (argumentObj, action = 'Click', message = '') => {
  if (actionFormatter && !isFunction(actionFormatter)) {
    warn('actionFormatter should be a function');
  }

  return ((message: string) => message.charAt(0).toUpperCase() + message.slice(1))(
    getActionMessage(action, actionVisitor(), argumentObj, message).trim(),
  );
};

const getArgumentsMessage = (
  argumentObj: { [k: string]: any },
  action: string,
  message: string,
  waitOpts?: { [k: string]: any },
) => `${getArgumentObjectMessage(argumentObj, action, message)}${getWaitingOptionsPrettyMessage(waitOpts)}`;

export { getArgumentsMessage, collectionRandomDataDescriptionMessage };
