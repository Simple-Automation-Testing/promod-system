/* eslint-disable sonarjs/cognitive-complexity, unicorn/consistent-function-scoping */
import { config } from '../../config/config';

import { getActionsList } from '../utils.random';
import { getCollectionsPathes } from '../create.type';
import { getCollectionMethodNames } from '../namings';

const { baseLibraryDescription = {}, collectionActionTypes = {} } = config.get();

function createTemplate(asActorAndPage, actionDescriptor) {
  const { action, _countResult, _type, _check } = actionDescriptor || {};

  const { getCollectionFrom, waitCollectionFrom } = getCollectionMethodNames(asActorAndPage, action);

  const getActionDeclaration = `declare function ${getCollectionFrom}(descriptions?: T${getCollectionFrom}Entry): Promise<T${getCollectionFrom}[]>;`;
  const waitActionDeclaration = `declare function ${waitCollectionFrom}(state: T${getCollectionFrom}Check, waitingCheckOpts?: ${baseLibraryDescription.waitOptionsId}, descriptions?: T${getCollectionFrom}Entry): Promise<void>;`;

  return `
  type T${getCollectionFrom}Entry = ${_type.get}
  type T${getCollectionFrom} = ${_countResult}
  type T${getCollectionFrom}Check = ${collectionActionTypes.compare}<${_check}, ${_check}>
  ${getActionDeclaration}
  ${waitActionDeclaration}
    `;
}

function getCountFlowsTypes(pageInstance, asActorAndPage) {
  const data = getCollectionsPathes(pageInstance);
  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    return `${flows}\n${createTemplate(asActorAndPage, dataObject)}`;
  }, '');
}

export { getCountFlowsTypes };
