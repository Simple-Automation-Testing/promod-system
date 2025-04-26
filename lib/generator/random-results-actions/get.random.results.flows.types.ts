/* eslint-disable sonarjs/no-nested-template-literals, sonarjs/cognitive-complexity*/
import { camelize } from 'sat-utils';
import { config } from '../../config/config';

import { getName, getFieldsEnumList } from '../utils.random';
import { getPageRandomGettersMethodNames } from '../namings';
import { getCollectionFlowTemplate } from '../based-actions/common';

const { baseLibraryDescription = {} } = config.get();

function createFlowTemplates(asActorAndPage, actionDescriptor) {
  const { action, /* _countResult, */ _type, _fields } = actionDescriptor || {};

  const typeName = camelize(`${asActorAndPage} get random Data and Field Values from ${getName(action)}`);

  const { getRandomDataActionName, getOneValueActionName, getSeveralValuesActionName } =
    getPageRandomGettersMethodNames(asActorAndPage, action);

  const fieldsType = `${_fields?.length ? `type T${typeName}EntryFields = ${getFieldsEnumList(_fields)}` : ''}`;

  const descriptionsType = `type T${typeName}Entry = ${_type[baseLibraryDescription.getDataMethod]}`;
  // TODO usage of the resultsType is required for future optimizations
  // const resultsType = `type T${typeName}Result = ${_countResult}`;

  const actionDeclarationRandomResults = `declare function ${getRandomDataActionName}<T extends ReadonlyArray<T${typeName}EntryFields>>(_fields: T, descriptions?: T${typeName}Entry): Promise<TobjectFromStringArray<T>>`;

  const actionDeclarationRandomData = `declare function ${getSeveralValuesActionName}(${
    _fields?.length ? `_field?: T${typeName}EntryFields, quantity?: number,` : 'quantity?: number,'
  } descriptions?: T${typeName}Entry): Promise<string[]>`;

  const severalFields = fieldsType ? `${actionDeclarationRandomResults}\n` : '';

  const firstLineOneValue = `declare function ${getOneValueActionName}(${
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
  return getCollectionFlowTemplate(asActorAndPage, pageInstance, createFlowTemplates);
}

export { getRandomResultsFlowsTypes };
