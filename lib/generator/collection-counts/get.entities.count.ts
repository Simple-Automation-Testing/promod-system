/* eslint-disable sonarjs/cognitive-complexity, unicorn/consistent-function-scoping */
import { createTemplatePureTemplate } from './get.pure.entities.count';
import { getCollectionMethodNames } from '../namings';
import { getCollectionFlowTemplate } from '../based-actions/common';

function createTemplate(asActorAndPage, actionDescriptor) {
  const { action, _countResult, _type, _check } = actionDescriptor || {};

  const { getCollectionFrom, waitCollectionFrom } = getCollectionMethodNames(asActorAndPage, action);

  return `
  type T${getCollectionFrom}Entry = ${_type.get}
  type T${getCollectionFrom} = ${_countResult}
  ${createTemplatePureTemplate(asActorAndPage, actionDescriptor, `: T${getCollectionFrom}Entry`, `: Promise<T${getCollectionFrom}[]>`)}
  `;
}

function getCountFlows(pageInstance, asActorAndPage) {
  return getCollectionFlowTemplate(asActorAndPage, pageInstance, createTemplate);
}

export { getCountFlows };
