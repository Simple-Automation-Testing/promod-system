/* eslint-disable sonarjs/cognitive-complexity, unicorn/consistent-function-scoping */
import { camelize } from 'sat-utils';

import { getActionsList, getName } from '../utils.random';
import { getCollectionsPathes } from '../create.type';

function createTemplate(asActorAndPage, actionDescriptor) {
  const { action, __countResult, _type } = actionDescriptor || {};

  const name = camelize(`${asActorAndPage} Get Collection From ${getName(action)}`);

  const actionDeclaration = `declare function ${name}(descriptions?: T${name}Entry): Promise<T${name}[]>;`;

  return `
  type T${name}Entry = ${_type.get}
  type T${name} = ${__countResult}
  ${actionDeclaration}
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
