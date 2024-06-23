import { camelize } from 'sat-utils';

import { config } from '../../config/config';

import { getElementsTypes, getFragmentTypes } from '../create.type';

const { baseLibraryDescription = {}, actionWithWaitOpts } = config.get();

function getFlowRestArguments(action: string): string {
  // TODO this should be done via config
  if (actionWithWaitOpts.includes(action)) {
    return `, opts?: ${baseLibraryDescription.waitOptionsId}`;
  } else if (baseLibraryDescription.generalActionOptionsId) {
    return `, opts?: ${baseLibraryDescription.generalActionOptionsId}`;
  }

  return '';
}

function getFlowTypes(instance: object, action: string, name: string, elementType?: boolean) {
  return {
    flowArgumentType: elementType
      ? getElementsTypes(instance, action, 'entryType')
      : getFragmentTypes(instance, action, 'entryType'),
    flowResultType: elementType
      ? getElementsTypes(instance, action, 'resultType')
      : getFragmentTypes(instance, action, 'resultType'),
    // eslint-disable-next-line sonarjs/no-nested-template-literals
    typeName: `T${camelize(`${name} ${action}`)}`,
  };
}

export { getFlowRestArguments, getFlowTypes };
