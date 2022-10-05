import { isUndefined } from 'sat-utils';
import { getArgumentsMessage } from './argument.object.message';
import { getDefaultMessage } from './argument.regular.message';
import { config } from '../config';

const getActionArgumentsMessagePart = (
  methodName: string,
  argumentObj: { [k: string]: any },
  waitionOption?: { [k: string]: any },
) => {
  const { prettyMethodName = {} } = config.get();

  if (isUndefined(argumentObj)) {
    return '';
  }

  const action = Object.values(prettyMethodName as { [k: string]: string }).find((prettyActionName: string) =>
    methodName.toLowerCase().includes(prettyActionName.toLowerCase()),
  );

  if (action) {
    return (
      getArgumentsMessage(argumentObj, action, '', waitionOption)
        // TODO this approach should be improve
        .replace(/  /gi, ' ')
    );
  }

  return getDefaultMessage(argumentObj);
};

export { getActionArgumentsMessagePart };
