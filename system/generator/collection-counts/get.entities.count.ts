/* eslint-disable sonarjs/cognitive-complexity, unicorn/consistent-function-scoping */
import { camelize } from 'sat-utils';
import { getActionsList, getName } from '../utils.random';
import { getCollectionsPathes } from '../check.that.action.exists';
import { createTemplatePureTemplate } from './get.pure.entities.count.object';

function createTemplate(asActorAndPage, actionDescriptor) {
  const { action, __countResult, _type } = actionDescriptor || {};

  const name = camelize(`${asActorAndPage} Get Collection From ${getName(action)}`);

  return `
  type T${name}Entry = ${_type.get}
  type T${name} = ${__countResult}
  ${createTemplatePureTemplate(asActorAndPage, actionDescriptor, `: T${name}Entry`, `: Promise<T${name}[]>`)}
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
