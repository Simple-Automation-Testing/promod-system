import { getArgumentsMessage } from './argument.object.message';
import { getConfiguration } from './config';

const getActionArgumentsMessagePart = (argumentObj, methodName, waitionOption) => {
  const { prettyMethodName } = getConfiguration();

  const action = Object.values(prettyMethodName as { [k: string]: string }).find((prettyActionName: string) =>
    methodName.toLowerCase().includes(prettyActionName.toLowerCase()),
  );

  const message = getArgumentsMessage(argumentObj, action, '', waitionOption);
};
