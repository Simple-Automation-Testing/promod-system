/* eslint-disable sonarjs/no-nested-template-literals, sonarjs/cognitive-complexity*/
import { camelize, stringifyData, toArray } from 'sat-utils';
import { config } from '../../config/config';
import { getCollectionsPathes } from '../check.that.action.exists';
import { getResult, getActionsList, getName, getFieldsEnumList } from '../utils.random';

const { baseLibraryDescription = {}, collectionDescription = {}, promod = {}, baseResultData = [] } = config.get();

function createFlowTemplates(asActorAndPage, actionDescriptor) {
  const { action, /* __countResult, */ _type, _fields } = actionDescriptor || {};

  const result = getResult(action);
  const typeName = camelize(`${asActorAndPage} get random Data and Field Values from ${getName(action)}`);
  const oneValue = camelize(`${asActorAndPage} get random field value from ${getName(action)}`);
  const severalValues = camelize(`${asActorAndPage} get several random field values from ${getName(action)}`);
  const randomData = camelize(`${asActorAndPage} get random data from ${getName(action)}`);

  const actionFields = `${_fields?.length ? `{ [_field]: null }` : 'null'}`;

  const actionSignature = stringifyData(action).replace(
    `${collectionDescription.action}: null`,
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
  const contentResult = toArray(baseResultData).includes('text') ? '.text' : '';

  const fieldsType = `${_fields?.length ? `type T${typeName}EntryFields = ${getFieldsEnumList(_fields)}` : ''}`;

  const descriptionsType = `type T${typeName}Entry = ${_type.get}`;
  // TODO usage of the resultsType is required for future optimizations
  // const resultsType = `type T${typeName}Result = ${__countResult}`;

  const isDeclaration = promod.actionsDeclaration === 'declaration';

  const firstLine = isDeclaration
    ? `async function ${randomData}<T extends ReadonlyArray<T${typeName}EntryFields>>(_fields: T, descriptions: T${typeName}Entry = {}): Promise<TobjectFromStringArray<T>> {`
    : `const ${randomData} = async <T extends ReadonlyArray<T${typeName}EntryFields>>(_fields: T, descriptions: T${typeName}Entry = {}): Promise<TobjectFromStringArray<T>> => {`;

  const firstLineSeveral = isDeclaration
    ? `async function ${severalValues}(${
        _fields?.length
          ? `_field: T${typeName}EntryFields = '${_fields[0]}', quantity: number = 2,`
          : 'quantity: number = 2,'
      } descriptions: T${typeName}Entry = {}): Promise<string[]> {`
    : `const ${severalValues} = async (${
        _fields?.length
          ? `_field: T${typeName}EntryFields = '${_fields[0]}', quantity: number = 2,`
          : 'quantity: number = 2,'
      } descriptions: T${typeName}Entry = {}): Promise<string[]>  => {`;

  const waiting = baseLibraryDescription.waitForVisibilityMethod
    ? `await ${baseLibraryDescription.getPageInstance ? `${baseLibraryDescription.getPageInstance}().` : 'page.'}${
        baseLibraryDescription.waitForVisibilityMethod
      }(${waitingSignature}, { everyArrayItem: false })`
    : '';

  const severalFields = fieldsType
    ? `
    ${firstLine}
      ${waiting}
      const result = await ${
        baseLibraryDescription.getPageInstance ? `${baseLibraryDescription.getPageInstance}().` : 'page.'
      }${baseLibraryDescription.getDataMethod}(${randomDataActionSignature});

      const flatResult = result.${result}
  return getRandomArrayItem(
    flatResult
      .map(item => _fields.reduce((requredData, k ) => {
        requredData[k] = item[k]${contentResult}

        return requredData
      }, {} as TobjectFromStringArray<T>))
  );
};\n`
    : '';

  const firstLineOneValue = isDeclaration
    ? `async function ${oneValue}(${
        _fields?.length ? `_field: T${typeName}EntryFields, ` : ''
      } descriptions: T${typeName}Entry = {}): Promise<string> {`
    : `const ${oneValue} = async (${
        _fields?.length ? `_field: T${typeName}EntryFields, ` : ''
      } descriptions: T${typeName}Entry = {}): Promise<string> => {`;

  return `
  ${fieldsType}
  ${descriptionsType}

  ${firstLineOneValue}
    ${waiting}
    const result = await ${
      baseLibraryDescription.getPageInstance ? `${baseLibraryDescription.getPageInstance}().` : 'page.'
    }${baseLibraryDescription.getDataMethod}(${actionSignature});

    const flatResult = result.${result}

    return getRandomArrayItem(
      flatResult
        .map(item => item${_fields?.length ? '[_field]' : ''}${contentResult}),
    );
  }

  ${firstLineSeveral}
    ${waiting}
    const result = await ${
      baseLibraryDescription.getPageInstance ? `${baseLibraryDescription.getPageInstance}().` : 'page.'
    }${baseLibraryDescription.getDataMethod}(${actionSignature});

    const flatResult = result.${result}

    return getRandomArrayItem(
      flatResult
        .map(item => item${_fields?.length ? '[_field]' : ''}${contentResult}),
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
