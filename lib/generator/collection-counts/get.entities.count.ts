/* eslint-disable sonarjs/cognitive-complexity, unicorn/consistent-function-scoping */
import { getActionsList } from '../utils.random';
import { getCollectionsPathes } from '../create.type';
import { createTemplatePureTemplate } from './get.pure.entities.count';
import { getCollectionMethodNames } from '../namings';

function createTemplate(asActorAndPage, actionDescriptor) {
  const { action, _countResult, _type, _check } = actionDescriptor || {};

  const { getCollectionFrom } = getCollectionMethodNames(asActorAndPage, action);

  return `
  type T${getCollectionFrom}Entry = ${_type.get}
  type T${getCollectionFrom} = ${_countResult}
  ${createTemplatePureTemplate(asActorAndPage, actionDescriptor, `: T${getCollectionFrom}Entry`, `: Promise<T${getCollectionFrom}[]>`)}
  `;
}

function getCountFlows(pageInstance, asActorAndPage) {
  const data = getCollectionsPathes(pageInstance);
  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    return `${flows}\n${createTemplate(asActorAndPage, dataObject)}`;
  }, '');
}

export { getCountFlows };
