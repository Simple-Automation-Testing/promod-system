/* eslint-disable complexity, sonarjs/cognitive-complexity */
import { isObject, prettifyCamelCase, isNull, isPrimitive } from 'sat-utils';

import { getIntexesMessage, getDescriptorMessage, isPropValueCollection, getWaitingOptionsPrettyMessage } from './base';
import { config } from '../config';

const getArgumentObjectMessage = (argumentObj, action = 'Click', message = '') => {
  const { collectionDescription } = config.get();

  const getActionMessage = (dataObj, initialMessage = '') => {
    return Object.keys(dataObj).reduce((actionMessage, key, index, keys) => {
      const startAction = actionMessage
        ? `${actionMessage}${prettifyCamelCase(action).toLowerCase()}`
        : `${prettifyCamelCase(action)}`;

      if (isPropValueCollection(key, dataObj[key])) {
        const {
          [collectionDescription.action]: collectionAction,
          [collectionDescription.index]: index,
          // TODO - add possibility to add count information
          [collectionDescription.count]: count,
          ...restDescription
        } = dataObj[key];

        const startMessagePart = `${startAction} '${key}' collection items `;

        const actionMessagePart = collectionAction ? getActionMessage(collectionAction, startMessagePart) : '';

        const descriptionMessage = Object.keys(restDescription).reduce((description, key) => {
          return `${description}${getDescriptorMessage(
            restDescription[key],
            ' where collection ',
            prettifyCamelCase(key.replace(/[^\da-z]/gi, '')).toLowerCase(),
          )}`;
        }, '');

        const indexesMessagePart = getIntexesMessage(index);

        return `${actionMessagePart}${descriptionMessage}${indexesMessagePart}`;
      }

      if (keys.length - 1 === index && !isObject(dataObj[key]) && isNull(dataObj[key])) {
        return `${startAction}'${key}' element`;
      }

      if (keys.length - 1 === index && !isObject(dataObj[key]) && isPrimitive(dataObj[key])) {
        return `${startAction} '${dataObj[key]}' to '${key}' element`;
      }

      if (!isObject(dataObj[key]) && isPrimitive(dataObj[key])) {
        return `${startAction} '${dataObj[key]}' to '${key}' element and than `;
      }

      if (isObject(dataObj[key]) && keys.length - 1 !== index) {
        const startMessagePart = `${startAction} '${key}' fragment elements `;
        return `${getActionMessage(dataObj[key], startMessagePart)} and than `;
      }

      if (isObject(dataObj[key]) && keys.length - 1 === index) {
        const startMessagePart = `${startAction} '${key}' fragment elements `;
        return `${getActionMessage(dataObj[key], startMessagePart)}`;
      }

      return actionMessage;
    }, initialMessage);
  };

  return getActionMessage(argumentObj, message);
};

const getArgumentsMessage = (
  argumentObj: { [k: string]: any },
  action: string,
  message: string,
  waitOpts?: { [k: string]: any },
) => `${getArgumentObjectMessage(argumentObj, action, message)}${getWaitingOptionsPrettyMessage(waitOpts)}`;

export { getArgumentsMessage };
