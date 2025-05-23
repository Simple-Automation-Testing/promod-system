/* eslint-disable sonarjs/no-nested-template-literals, sonarjs/cognitive-complexity*/
import { camelize, stringifyData, toArray } from 'sat-utils';

import { config } from '../../config/config';
import { getResult, getName, getFieldsEnumList } from '../utils.random';
import { getPageRandomGettersMethodNames } from '../namings';
import { getCollectionFlowTemplate } from '../based-actions/common';

const { baseLibraryDescription = {}, collectionDescription = {}, promod = {}, baseResultData = [] } = config.get();

function createFlowTemplates(asActorAndPage, actionDescriptor) {
  const { action, /* _countResult, */ _fields } = actionDescriptor || {};

  const result = getResult(action);
  const typeName = camelize(`${asActorAndPage} get random Data and Field Values from ${getName(action)}`);

  const { getRandomDataActionName, getOneValueActionName, getSeveralValuesActionName } =
    getPageRandomGettersMethodNames(asActorAndPage, action);

  const actionFields = `${_fields?.length ? '{ [_field]: null }' : 'null'}`;

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

  // TODO usage of the resultsType is required for future optimizations
  // const resultsType = `type T${typeName}Result = ${_countResult}`;

  const isDeclaration = promod.actionsDeclaration === 'declaration';

  const firstLine = isDeclaration
    ? `async function ${getRandomDataActionName}(_fields, descriptions = {}) {`
    : `const ${getRandomDataActionName} = async (_fields, descriptions = {}) => {`;

  const firstLineSeveral = isDeclaration
    ? `async function ${getSeveralValuesActionName}(${
        _fields?.length ? `_field = '${_fields[0]}', quantity = 2,` : 'quantity = 2,'
      } descriptions = {}) {`
    : `const ${getSeveralValuesActionName} = async (${
        _fields?.length ? `_field = '${_fields[0]}', quantity = 2,` : 'quantity = 2,'
      } descriptions = {}) => {`;

  const waiting = baseLibraryDescription.waitForVisibilityMethod
    ? `await ${baseLibraryDescription.getPageInstance ? `${baseLibraryDescription.getPageInstance}().` : 'page.'}${
        baseLibraryDescription.waitForVisibilityMethod
      }(${waitingSignature}, { everyArrayItem: false })`
    : '';

  const severalFields = fieldsType
    ? /**
       * @info if fieldsType exists we have a function that generates get data as an oblejct with several fields
       */
      `
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
      }, {}))
  );
};\n`
    : /**
       * @info if fieldsType does not exist we have empty line there
       */
      '';

  const firstLineOneValue = isDeclaration
    ? `async function ${getOneValueActionName}(${_fields?.length ? `_field, ` : ''} descriptions = {}){`
    : `const ${getOneValueActionName} = async (${_fields?.length ? `_field, ` : ''} descriptions = {}) => {`;

  return `
  ${firstLineOneValue}
    ${waiting}
    const result = await page.${baseLibraryDescription.getDataMethod}(${actionSignature});

    const flatResult = result.${result}

    return getRandomArrayItem(
      flatResult
        .map(item => item${_fields?.length ? '[_field]' : ''}${contentResult}),
    );
  }

  ${firstLineSeveral}
    ${waiting}
    const result = await page.${baseLibraryDescription.getDataMethod}(${actionSignature});

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

function getPureRandomResultsFlows(asActorAndPage, pageInstance) {
  return getCollectionFlowTemplate(asActorAndPage, pageInstance, createFlowTemplates);
}

export { getPureRandomResultsFlows };
