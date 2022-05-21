import { getArgumentsMessage } from './argument.object.message';
import { getDefaultMessage } from './argument.regular.message';
import { getConfiguration } from './config';

const getActionArgumentsMessagePart = (
  methodName: string,
  argumentObj: { [k: string]: any },
  waitionOption?: { [k: string]: any },
) => {
  const { prettyMethodName } = getConfiguration();

  const action = Object.values(prettyMethodName as { [k: string]: string }).find((prettyActionName: string) =>
    methodName.toLowerCase().includes(prettyActionName.toLowerCase()),
  );

  return action ? getArgumentsMessage(argumentObj, action, '', waitionOption) : getDefaultMessage(argumentObj);
};

export { getActionArgumentsMessagePart };
