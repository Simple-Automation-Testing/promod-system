/* eslint-disable sonarjs/no-nested-template-literals */
import { camelize, safeJSONstringify } from 'sat-utils';
import { config } from '../config/config';
import { getCollectionsPathes } from './check.that.action.exists';
import { getResult, getActionsList, getName, getFieldsEnumList } from './utils.random';

function createFlowTemplates(asActorAndPage, actionDescriptor) {
  const { baseLibraryDescription = {}, collectionDescription = {} } = config.get();
  const { action, /* __countResult, */ __visible = 'any', __where = 'any', _fields } = actionDescriptor || {};

  const result = getResult(action);
  const typeName = camelize(`${asActorAndPage} get random Data and Field Values from ${getName(action)}`);
  const oneValue = camelize(`${asActorAndPage} get random field value from ${getName(action)}`);
  const severalValues = camelize(`${asActorAndPage} get several random field values from ${getName(action)}`);
  const randomData = camelize(`${asActorAndPage} get random data from ${getName(action)}`);

  const actionFields = `${_fields ? `{ [_field]: null }` : 'null'}`;

  const actionSignature = safeJSONstringify(action).replace(
    `"${collectionDescription.action}": null`,
    // TODO this approach should be improved
    `...descriptions, ${collectionDescription.action}: ${actionFields}`,
  );
  const waitingSignature = actionSignature.replace(
    `...descriptions, ${collectionDescription.action}: ${actionFields}`,
    `...descriptions, length: '>0'`,
  );
  const randomDataActionSignature = actionSignature.replace(
    `...descriptions, ${collectionDescription.action}: ${actionFields}`,
    `...descriptions, ${collectionDescription.action}: _fields.reduce((act, k) => {
      act[k] = null;

      return act
    }, {})`,
  );

  const fieldsType = `${_fields ? `type T${typeName}EntryFields = ${getFieldsEnumList(_fields)}` : ''}`;
  const descriptionsType = `type T${typeName}Entry = {
    ${collectionDescription.whereNot || '_whereNot'}?: ${__where} | ${__where}[];
    ${collectionDescription.where || '_where'}?: ${__where} | ${__where}[];
    ${collectionDescription.visible || '_visible'}?: ${__visible} | ${__visible}[];
  }`;
  // TODO usage of the resultsType is required for future optimizations
  // const resultsType = `type T${typeName}Result = ${__countResult}`;

  const severalFields = fieldsType
    ? `
    const ${randomData} = async function<T extends ReadonlyArray<T${typeName}EntryFields>>(_fields: T, descriptions: T${typeName}Entry = {}): Promise<TobjectFromStringArray<T>> {
      await page.${baseLibraryDescription.waitForVisibilityMethod}(${waitingSignature}, { everyArrayItem: false })
      const result = await page.${baseLibraryDescription.getDataMethod}(${randomDataActionSignature});

      const flatResult = result.${result}
  return getRandomArrayItem(
    flatResult
      .map(item => _fields.reduce((requredData, k ) => {
        requredData[k] = item[k].text

        return requredData
      }, {} as TobjectFromStringArray<T>))
  );
};\n`
    : '';

  return `
  ${fieldsType}
  ${descriptionsType}

  const ${oneValue} = async function(${
    _fields ? `_field: T${typeName}EntryFields, ` : ''
  } descriptions: T${typeName}Entry = {}): Promise<string> {
    await page.${baseLibraryDescription.waitForVisibilityMethod}(${waitingSignature}, { everyArrayItem: false })
    const result = await page.${baseLibraryDescription.getDataMethod}(${actionSignature});

    const flatResult = result.${result}

    return getRandomArrayItem(
      flatResult
        .map(item => item${_fields ? '[_field]' : ''}.text),
    );
  }

  const ${severalValues} = async function(${
    _fields ? `_field: T${typeName}EntryFields = '${_fields[0]}', quantity: number = 2,` : 'quantity: number = 2,'
  } descriptions: T${typeName}Entry = {}): Promise<string[]> {
    await page.${baseLibraryDescription.waitForVisibilityMethod}(${waitingSignature}, { everyArrayItem: false })
    const result = await page.${baseLibraryDescription.getDataMethod}(${actionSignature});

    const flatResult = result.${result}

    return getRandomArrayItem(
      flatResult
        .map(item => item${_fields ? '[_field]' : ''}.text),
      quantity,
    );
  }
  ${severalFields}
`;
}

function getRandomResultsFlows(asActorAndPage, pageInstance) {
  const data = getCollectionsPathes(pageInstance);

  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    return `${flows}${createFlowTemplates(asActorAndPage, dataObject)}`;
  }, '');
}

export { getRandomResultsFlows };
