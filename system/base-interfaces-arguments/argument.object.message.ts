/* eslint-disable complexity, sonarjs/cognitive-complexity */
import { isObject, prettifyCamelCase, isNull, isPrimitive } from 'sat-utils';

import { getIntexesMessage, getDescriptorMessage, isPropValueCollection, getWaitingOptionsPrettyMessage } from './base';
import { getConfiguration } from '../config';

const getArgumentObjectMessage = (argumentObj, action = 'Click', message = '') => {
  const getActionMessage = (dataObj, initialMessage = '') =>
    Object.keys(dataObj).reduce((actionMessage, key, index, keys) => {
      const { collectionDescription } = getConfiguration();

      const startAction = actionMessage
        ? `${actionMessage}${prettifyCamelCase(action).toLowerCase()} `
        : `${prettifyCamelCase(action)} `;

      if (isPropValueCollection(key, dataObj[key])) {
        const action = dataObj[key][collectionDescription.action];
        const where = dataObj[key][collectionDescription.where];
        const visible = dataObj[key][collectionDescription.visible];
        const indexes = dataObj[key][collectionDescription.index];

        const startMessagePart = `${startAction}'${key}' collection items `;

        const actionMessagePart = action ? getActionMessage(action, startMessagePart) : '';
        const whereMessagePart = getDescriptorMessage(where, ' where collection ', 'state');

        const visibleMessagePart = getDescriptorMessage(visible, ' where collection ', 'where', 'visibility');
        const indexesMessagePart = getIntexesMessage(indexes);

        return `${actionMessagePart}${whereMessagePart}${visibleMessagePart}${indexesMessagePart}`;
      }

      if (keys.length - 1 === index && !isObject(dataObj[key]) && isNull(dataObj[key])) {
        return `${startAction}'${key}' element`;
      }

      if (keys.length - 1 === index && !isObject(dataObj[key]) && isPrimitive(dataObj[key])) {
        return `${startAction}'${dataObj[key]}' to '${key}' element`;
      }

      if (!isObject(dataObj[key]) && isPrimitive(dataObj[key])) {
        return `${startAction}'${dataObj[key]}' to '${key}' element and than `;
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

  return getActionMessage(argumentObj, message);
};

const getArgumentsMessage = (
  argumentObj: { [k: string]: any },
  action: string,
  message: string,
  waitOpts?: { [k: string]: any },
) => `${getArgumentObjectMessage(argumentObj, action, message)}${getWaitingOptionsPrettyMessage(waitOpts)}`;

export { getArgumentsMessage };
