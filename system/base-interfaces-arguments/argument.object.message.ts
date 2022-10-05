/* eslint-disable complexity, sonarjs/cognitive-complexity */
import { isObject, prettifyCamelCase, isNull, isPrimitive } from 'sat-utils';

import { getIntexesMessage, getDescriptorMessage, isPropValueCollection, getWaitingOptionsPrettyMessage } from './base';
import { config } from '../config';

const getArgumentObjectMessage = (argumentObj, action = 'Click', message = '') => {
  const { collectionDescription, actionFormatter } = config.get();

  const getActionMessage = (dataObj, initialMessage = '') => {
    return Object.keys(dataObj).reduce((actionMessage, key, index, keys) => {
      const isLastKey = keys.length - 1 === index;
      const messageEnd = isLastKey ? '' : ' and than ';
      const formattedAction = actionFormatter && isPrimitive(dataObj[key]) ? actionFormatter(action) : action;

      const startAction = actionMessage
        ? `${actionMessage}${prettifyCamelCase(formattedAction).toLowerCase()}`
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

        const descriptionMessage = Object.keys(restDescription).reduce((description, key) => {
          return `${description}${getDescriptorMessage(
            restDescription[key],
            ` ${prettifyCamelCase(key.replace(/[^\da-z]/gi, '')).toLowerCase()} collection `,
          )}`;
        }, '');
        const indexesMessagePart = getIntexesMessage(index);

        const actionMessagePart = collectionAction
          ? getActionMessage(collectionAction, `${startMessagePart} ${descriptionMessage} ${indexesMessagePart}`)
          : '';

        return `${actionMessagePart}`;
      }

      // TODO improve
      if (isNull(dataObj[key])) {
        return `${startAction}'${key}' element${messageEnd}`;
      }

      if (isPrimitive(dataObj[key])) {
        return `${startAction} '${dataObj[key]}' to '${key}' element${messageEnd}`;
      }

      if (isObject(dataObj[key])) {
        const startMessagePart = `${startAction} '${key}' fragment elements `;
        return `${getActionMessage(dataObj[key], startMessagePart)}${messageEnd}`;
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
