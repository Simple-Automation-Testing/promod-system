/* eslint-disable complexity, sonarjs/cognitive-complexity, sonarjs/no-identical-functions*/
import { isString, isObject, prettifyCamelCase, isNull, isPrimitive } from 'sat-utils';

import {
  isBase,
  stringifyBase,
  getIntexesMessage,
  getDescriptorMessage,
  isPropValueCollection,
  isPropValuesRandomCollectionItem,
  getWaitingOptionsPrettyMessage,
} from './base';
import { config } from '../config';

const getArgumentObjectMessage = (argumentObj, action = 'Click', message = '') => {
  const { collectionDescription, actionFormatter } = config.get();

  const getActionMessage = (dataObj, initialMessage = '') => {
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

      if (
        startMessage.endsWith(prettifyCamelCase(action).toLowerCase()) &&
        isPrimitive(collectionAction) &&
        actionFormatter
      ) {
        startMessage = startMessage.replace(
          new RegExp(`(${prettifyCamelCase(action).toLowerCase()})$`),
          actionFormatter(action).toLowerCase(),
        );
      }

      const startMessagePart = `${startMessage}${actionMessage}${keyMessagePart} collection items `;
      const descriptionMessage = Object.keys(restDescription).reduce((description, key) => {
        return `${description}${getDescriptorMessage(
          restDescription[key],
          ` ${prettifyCamelCase(key.replace(/[^\da-z]/gi, '')).toLowerCase()} collection `,
        )}`;
      }, '');

      const indexesMessagePart = getIntexesMessage(index);

      const actionMessagePart = isObject(collectionAction)
        ? getActionMessage(collectionAction, `${startMessagePart}${descriptionMessage}${indexesMessagePart}`)
        : `${startMessagePart}${descriptionMessage}${indexesMessagePart}`;

      return `${actionMessagePart}`;
    };

    const collectionRandomDataDescriptionMessage = (data: { [k: string]: any }, startMessage: string) => {
      const {
        [collectionDescription.index]: index,
        // TODO - add possibility to add count information
        [collectionDescription.count]: count,
        except,
        like,
        field,
        ...restDescription
      } = data;

      const exceptMessagePart =
        except && except.length
          ? `, initial list should not have values like ${except.length === 1 ? 'this' : 'these'} '${except.join(
              ',',
            )}' `
          : '';
      const likeMessagePart =
        like && like.length
          ? `, initial list should have values like ${like.length === 1 ? 'this' : 'these'} '${like.join(',')}' `
          : '';

      const fieldMessagePart = field ? ` field '${field}' ` : ' ';

      const descriptionMessage = Object.keys(restDescription).reduce((description, key) => {
        return `${description}${getDescriptorMessage(
          restDescription[key],
          ` ${prettifyCamelCase(key.replace(/[^\da-z]/gi, '')).toLowerCase()} collection `,
        )}`;
      }, '');

      return `${startMessage}${fieldMessagePart}${exceptMessagePart}${likeMessagePart}${descriptionMessage}`;
    };

    if (isPropValuesRandomCollectionItem(dataObj, action)) {
      return collectionRandomDataDescriptionMessage(
        dataObj,
        prettifyCamelCase(actionFormatter ? actionFormatter(action) : action, { firstWordUpperCase: true }),
      );
    }

    if (isPropValueCollection(dataObj, action)) {
      return collectionDescriptionMessage(
        dataObj,
        prettifyCamelCase(actionFormatter ? actionFormatter(action) : action, { firstWordUpperCase: true }),
      );
    }

    return Object.keys(dataObj).reduce((actionMessage, key, index, keys) => {
      const isLastKey = keys.length - 1 === index;
      const messageEnd = isLastKey ? '' : ' and than ';

      const formattedAction = actionFormatter && isPrimitive(dataObj[key]) ? actionFormatter(action) : action;

      const startAction = actionMessage
        ? `${actionMessage}${prettifyCamelCase(formattedAction, { firstWordUpperCase: true }).toLowerCase()}`
        : `${prettifyCamelCase(formattedAction, { firstWordUpperCase: true })}`;

      if (isPropValueCollection(dataObj[key], action, key)) {
        return collectionDescriptionMessage(dataObj[key], startAction, key);
      }

      // TODO improve
      if (isNull(dataObj[key])) {
        return `${startAction}'${key}' element${messageEnd}`;
      }

      if (isPrimitive(dataObj[key])) {
        return `${startAction} '${dataObj[key]}' to '${key}' element${messageEnd}`;
      }

      if (isBase(dataObj[key])) {
        return `${startAction} '${key}' element '${stringifyBase(dataObj[key])}'${messageEnd}`;
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
