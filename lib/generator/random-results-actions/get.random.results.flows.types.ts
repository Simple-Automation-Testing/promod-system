/* eslint-disable sonarjs/no-nested-template-literals, sonarjs/cognitive-complexity*/
import { camelize } from 'sat-utils';

import { getCollectionsPathes } from '../create.type';
import { getActionsList, getName, getFieldsEnumList } from '../utils.random';

function createFlowTemplates(asActorAndPage, actionDescriptor) {
  const { action, /* _countResult, */ _type, _fields } = actionDescriptor || {};

  const typeName = camelize(`${asActorAndPage} get random Data and Field Values from ${getName(action)}`);
  const oneValue = camelize(`${asActorAndPage} get random field value from ${getName(action)}`);
  const severalValues = camelize(`${asActorAndPage} get several random field values from ${getName(action)}`);
  const randomData = camelize(`${asActorAndPage} get random data from ${getName(action)}`);

  const fieldsType = `${_fields?.length ? `type T${typeName}EntryFields = ${getFieldsEnumList(_fields)}` : ''}`;

  const descriptionsType = `type T${typeName}Entry = ${_type.get}`;
  // TODO usage of the resultsType is required for future optimizations
  // const resultsType = `type T${typeName}Result = ${_countResult}`;

  const actionDeclarationRandomResults = `declare function ${randomData}<T extends ReadonlyArray<T${typeName}EntryFields>>(_fields: T, descriptions?: T${typeName}Entry): Promise<TobjectFromStringArray<T>>`;

  const actionDeclarationRandomData = `declare function ${severalValues}(${
    _fields?.length ? `_field?: T${typeName}EntryFields, quantity?: number,` : 'quantity?: number,'
  } descriptions?: T${typeName}Entry): Promise<string[]>`;

  const severalFields = fieldsType ? `${actionDeclarationRandomResults}\n` : '';

  const firstLineOneValue = `declare function ${oneValue}(${
    _fields?.length ? `_field: T${typeName}EntryFields, ` : ''
  } descriptions?: T${typeName}Entry): Promise<string>;`;

  return `
  ${fieldsType}
  ${descriptionsType}
  ${firstLineOneValue}
  ${actionDeclarationRandomData}
  ${severalFields}
`;
}

function getRandomResultsFlowsTypes(asActorAndPage, pageInstance) {
  const data = getCollectionsPathes(pageInstance);

  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    return `${flows}${createFlowTemplates(asActorAndPage, dataObject)}`;
  }, '');
}

export { getRandomResultsFlowsTypes };
