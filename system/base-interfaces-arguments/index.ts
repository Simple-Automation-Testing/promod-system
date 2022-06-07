import { isFunction, isUndefined } from 'sat-utils';
import { getArgumentsMessage } from './argument.object.message';
import { getDefaultMessage } from './argument.regular.message';
import { getConfiguration } from './config';

type TActionFormatter = {
  (action: string): string;
};

const getActionArgumentsMessagePart = (
  methodName: string,
  argumentObj: { [k: string]: any },
  waitionOption?: TActionFormatter | { [k: string]: any },
  actionFormatter?: TActionFormatter,
) => {
  if (isFunction(waitionOption)) {
    actionFormatter = waitionOption as TActionFormatter;
    waitionOption = null;
  }

  if (!isFunction(actionFormatter) && !isUndefined(actionFormatter)) {
    throw new TypeError('getActionArgumentsMessagePart(): third or fourth argument should be a function or undefined');
  }

  if (isUndefined(argumentObj)) {
    return '';
  }

  const { prettyMethodName } = getConfiguration();

  const action = Object.values(prettyMethodName as { [k: string]: string }).find((prettyActionName: string) =>
    methodName.toLowerCase().includes(prettyActionName.toLowerCase()),
  );
  if (action && actionFormatter) {
    return getArgumentsMessage(argumentObj, actionFormatter(action), '', waitionOption);
  }
  if (action) {
    return getArgumentsMessage(argumentObj, action, '', waitionOption);
  }

  return getDefaultMessage(argumentObj);
};

export { getActionArgumentsMessagePart };
