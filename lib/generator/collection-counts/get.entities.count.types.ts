/* eslint-disable sonarjs/cognitive-complexity, unicorn/consistent-function-scoping */
import { config } from '../../config/config';

import { getActionsList } from '../utils.random';
import { getCollectionsPathes } from '../create.type';
import { getCollectionMethodNames } from '../namings';
import { getCollectionFlowTemplate } from '../based-actions/common';

const { baseLibraryDescription = {}, collectionActionTypes = {} } = config.get();

function createTemplate(asActorAndPage, actionDescriptor) {
  const objectStrategy = baseLibraryDescription.getCollectionTypeFormat === 'object';
  const { action, _countResult, _type, _check } = actionDescriptor || {};

  const { getCollectionFrom, waitCollectionFrom } = getCollectionMethodNames(asActorAndPage, action);

  const getActionDeclaration = `declare function ${getCollectionFrom}(descriptions?: T${getCollectionFrom}Entry): Promise<T${getCollectionFrom}[]>;`;
  const waitActionDeclaration = `declare function ${waitCollectionFrom}(state: T${getCollectionFrom}Check, waitingCheckOpts?: ${baseLibraryDescription.waitOptionsId}, descriptions?: T${getCollectionFrom}Entry): Promise<void>;`;

  const compareDataType = objectStrategy ? `<${_check}>` : `<${_type.get}, ${_check}>`;
  return `
  type T${getCollectionFrom}Entry = ${_type[baseLibraryDescription.getDataMethod]}
  type T${getCollectionFrom} = ${_countResult}
  type T${getCollectionFrom}Check = ${collectionActionTypes.compare}${compareDataType}
  ${getActionDeclaration}
  ${waitActionDeclaration}
    `;
}

function getCountFlowsTypes(pageInstance, asActorAndPage) {
  return getCollectionFlowTemplate(asActorAndPage, pageInstance, createTemplate);
}

export { getCountFlowsTypes };
