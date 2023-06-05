/* eslint-disable no-console, complexity, sonarjs/cognitive-complexity, sonarjs/no-identical-functions*/
import { isFunction, toArray, isArray, isString, isObject, prettifyCamelCase, isNull, isPrimitive } from 'sat-utils';

import {
  isBase,
  stringifyBase,
  getIntexesMessage,
  getDescriptorMessage,
  isPropValueCollection,
  getWaitingOptionsPrettyMessage,
} from './base';
import { config } from '../config';

function getFieldsEnumList(fieldsArr: string[]) {
  return fieldsArr.reduce((enumList, item, index, arr) => {
    const separator = index === arr.length - 1 ? '' : ',';
    return `${enumList} '${item}'${separator}`;
  }, '');
}

const collectionRandomDataDescriptionMessage = (fileds: string | string[], data: { [k: string]: any }) => {
  const { collectionDescription } = config.get();
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
};

const getArgumentObjectMessage = (argumentObj, action = 'Click', message = '') => {
  const { collectionDescription, actionFormatter } = config.get();
  if (actionFormatter && !isFunction(actionFormatter)) {
    console.warn('actionFormatter should be a function');
  }

  const updateActionSignature = isFunction(actionFormatter)
    ? actionFormatter
    : (action: string, isItStart?: boolean) => action;

  const getActionMessage = (dataObj, initialMessage = '', isItStart?: boolean) => {
    const collectionDescriptionMessage = (data: { [k: string]: any }, startMessage: string, key?: string) => {
      const {
        [collectionDescription.action]: collectionAction,
        [collectionDescription.index]: index,
        // TODO - add possibility to add count information
        [collectionDescription.count]: count,
        ...restDescription
      } = data;

      const actionMessage = isString(collectionAction) ? ` '${collectionAction}' to ` : ' ';
      const keyMessagePart = isString(key) ? `'${key}'` : '';

      if (startMessage.endsWith(prettifyCamelCase(action).toLowerCase()) && isPrimitive(collectionAction)) {
        startMessage = startMessage.replace(
          new RegExp(`(${prettifyCamelCase(action).toLowerCase()})$`),
          updateActionSignature(action, isItStart).toLowerCase(),
        );
      }

      const startMessagePart = `${startMessage}${actionMessage}${keyMessagePart} collection items `;

      const descriptionMessage = Object.keys(restDescription).reduce((description, descriptorKey) => {
        return `${description}${getDescriptorMessage(
          restDescription[descriptorKey],
          ` ${prettifyCamelCase(descriptorKey.replace(/[^\da-z]/gi, '')).toLowerCase()} collection `,
        )}`;
      }, '');

      const indexesMessagePart = getIntexesMessage(index);
      const actionMessagePart = isObject(collectionAction)
        ? getActionMessage(collectionAction, `${startMessagePart}${descriptionMessage}${indexesMessagePart}`)
        : `${startMessagePart}${descriptionMessage}${indexesMessagePart}`;

      return `${actionMessagePart}`;
    };

    if (isPropValueCollection(dataObj, action)) {
      return collectionDescriptionMessage(dataObj, prettifyCamelCase(updateActionSignature(action, isItStart)));
    }

    return Object.keys(dataObj).reduce((actionMessage, key, index, keys) => {
      const isLastKey = keys.length - 1 === index;
      const messageEnd = isLastKey ? '' : ' \n and then ';

      const formattedAction = updateActionSignature(action, isItStart);

      const formatedAction = prettifyCamelCase(formattedAction);

      const startAction = actionMessage ? `${actionMessage}${formatedAction.toLowerCase()}` : `${formatedAction}`;

      if (isPropValueCollection(dataObj[key], action, key)) {
        return collectionDescriptionMessage(dataObj[key], startAction, key);
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
        return `${getActionMessage(dataObj[key], startMessagePart)}${messageEnd}`;
      }

      return actionMessage;
    }, `${initialMessage}\n`);
  };

  return ((message: string) => message.charAt(0).toUpperCase() + message.slice(1))(
    getActionMessage(argumentObj, message, true).trim(),
  );
};

const getArgumentsMessage = (
  argumentObj: { [k: string]: any },
  action: string,
  message: string,
  waitOpts?: { [k: string]: any },
) => `${getArgumentObjectMessage(argumentObj, action, message)}${getWaitingOptionsPrettyMessage(waitOpts)}`;

export { getArgumentsMessage, collectionRandomDataDescriptionMessage };
