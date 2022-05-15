/* eslint-disable complexity */
import { isObject, prettifyCamelCase } from 'sat-utils';

import { getIntexesMessage, getDescriptorMessage, isPropValueCollection, getWaitingOptionsPrettyMessage } from './base';
import { getConfiguration } from './config';

const getArgumentObjectMessage = (argumentObj, action = 'Click', message = '') => {
  const getActionMessage = (dataObj, initialMessage = '') =>
    Object.keys(dataObj).reduce((actionMessage, key, index, keys) => {
      const { collectionDescription } = getConfiguration();
      const startAction = actionMessage ? `${actionMessage} ${action.toLowerCase()} ` : `${action} `;

      if (isPropValueCollection(key, dataObj[key])) {
        const action = dataObj[key][collectionDescription.action];
        const where = dataObj[key][collectionDescription.where];
        const visible = dataObj[key][collectionDescription.visible];
        const indexes = dataObj[key][collectionDescription.index];

        const actionMessagePart = action ? getActionMessage(action) : '';
        const whereMessagePart = getDescriptorMessage(where);
        const visibleMessagePart = getDescriptorMessage(visible);
        const indexesMessagePart = getIntexesMessage(indexes);

        return `${startAction}'${prettifyCamelCase(
          key,
        )}' collection${actionMessagePart}${whereMessagePart}${visibleMessagePart}${indexesMessagePart}`;
      }

      if (keys.length === 1 && !isObject(dataObj[key])) {
        return `${startAction}'${prettifyCamelCase(key)}'`;
      }

      if (keys.length - 1 === index && !isObject(dataObj[key])) {
        return `${startAction}'${prettifyCamelCase(key)}'`;
      }

      if (!isObject(dataObj[key])) {
        return `${startAction}'${prettifyCamelCase(key)}' and than`;
      }

      if (isObject(dataObj[key]) && keys.length - 1 !== index) {
        return `${startAction}fragment elements ${getActionMessage(dataObj[key], actionMessage)} and than`;
      }

      if (isObject(dataObj[key]) && keys.length - 1 === index) {
        return `${startAction}'${prettifyCamelCase(key)}' fragment elements ${getActionMessage(
          dataObj[key],
          actionMessage,
        )}`;
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
