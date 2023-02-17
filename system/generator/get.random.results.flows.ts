/* eslint-disable sonarjs/no-nested-template-literals */
import { isObject, camelize } from 'sat-utils';
import { config } from '../config/config';
import { getPathesToCollections } from './get.fragments.for.random.getting';
import { isCollectionDescription, toRandomTemplateFormat, finTypedObject } from './utils.random';

function getWaitForCollectionArgumentTemplate(dataObj, expression = '>0') {
  return Object.keys(dataObj).reduce((template, key) => {
    return isObject(dataObj[key]) && !isCollectionDescription(dataObj[key])
      ? `${template} ${key}: ${getWaitForCollectionArgumentTemplate(dataObj[key], expression)} }`
      : `${template} ${key}: { length: \`${expression}\` } }`;
  }, '{');
}

function getFieldsEnumList(fieldsArr: string[]) {
  return fieldsArr.reduce((enumList, item, index, arr) => {
    const separator = index === arr.length - 1 ? '' : '|';
    return `${enumList} '${item}' ${separator}`;
  }, '');
}

function getPropPath(dataObj) {
  if (!isCollectionDescription(dataObj)) {
    return `${Object.keys(dataObj)[0]} ${getPropPath(dataObj[Object.keys(dataObj)[0]])}`;
  }

  return '';
}

function getFlowEntryType(dataObj, { namePart = '', additional = '' } = {}) {
  const typeName = `T${camelize(getPropPath(dataObj))}${namePart}`;

  const { _fields, ...restCollectionDescription } = finTypedObject(dataObj);

  const descriptionType = Object.keys(restCollectionDescription).reduce(
    (descriptionType, key, index, allDescriptionKeys) => {
      const endString = index !== allDescriptionKeys.length - 1 && allDescriptionKeys.length > 1 ? '\n' : '';

      return (descriptionType += `${key}?: ${restCollectionDescription[key]}${endString}`);
    },
    ``,
  );

  const exectLikePart = `${additional ? additional + '\n' : ''}except?: string | string[];
  like?: string | string[];
  ${descriptionType}`;

  return _fields
    ? {
        typeName,
        type: `type ${typeName} = {
  field: ${getFieldsEnumList(_fields)};
${exectLikePart}
};`,
      }
    : {
        typeName,
        type: `type ${typeName} = {
${exectLikePart}
};`,
      };
}

function getReturnArgumentTemplate(dataObj) {
  const { collectionDescription } = config.get();
  const { _fields, ...restCollectionDescription } = finTypedObject(dataObj);

  const descriptionType = Object.keys(restCollectionDescription).reduce(
    (descriptionType, key, index, allDescriptionKeys) => {
      const endString = index !== allDescriptionKeys.length - 1 && allDescriptionKeys.length > 1 ? ', ' : ' ';

      return (descriptionType += `${key}: data.${key}${endString}`);
    },
    ``,
  );

  return Object.keys(dataObj).reduce((template, key) => {
    if (isObject(dataObj[key]) && !isCollectionDescription(dataObj[key])) {
      return `${template} ${key}: ${getReturnArgumentTemplate(dataObj[key])} }`;
    } else if (_fields) {
      return `${template} ${key}: { ${collectionDescription.action}: { [data.field]: null }, ${descriptionType} } }`;
    } else {
      return `${template} ${key}: { ${collectionDescription.action}: null, ${descriptionType} } }`;
    }
  }, '{');
}

function getReturnTemplateAndLastKey(dataObj) {
  let lastKey;

  function getReturnTemplate(dataObj) {
    return Object.keys(dataObj).reduce((template, key) => {
      if (isObject(dataObj[key]) && !isCollectionDescription(dataObj[key])) {
        return `${template} ${key}: ${getReturnTemplate(dataObj[key])} }`;
      } else {
        lastKey = key;
        return `${template} ${key} }`;
      }
    }, '{');
  }
  const returnTemplate = getReturnTemplate(dataObj);

  return {
    returnTemplate,
    lastKey,
  };
}

function createFlowTemplates(asActorAndPage, dataObj) {
  const { baseLibraryDescription } = config.get();

  const oneValue = getFlowEntryType(dataObj);
  const severalValues = getFlowEntryType(dataObj, { namePart: 'SeveralValues', additional: 'quantity: number;' });

  const { lastKey, returnTemplate } = getReturnTemplateAndLastKey(dataObj);
  const argumentTemplate = getReturnArgumentTemplate(dataObj);

  const oneValueName = camelize(`${asActorAndPage} get random data from ${getPropPath(dataObj)}`);
  const severalValuesName = camelize(`${asActorAndPage} get several random values from ${getPropPath(dataObj)}`);

  return `\n
${oneValue.type}
const ${oneValueName} = async function(data: ${oneValue.typeName} = {${
    oneValue.type.includes('field:') ? `field: '${finTypedObject(dataObj)._fields[0]}'` : ''
  }}): Promise<string> {
  await page.${baseLibraryDescription.waitForVisibilityMethod}(${getWaitForCollectionArgumentTemplate(dataObj)})
  const ${returnTemplate} = await page.${baseLibraryDescription.getDataMethod}(${argumentTemplate});

  const excludeValues = toArray(data.except);
  const includeValues = toArray(data.like);

  return getRandomArrayItem(
    ${lastKey}
      .map(item => item${oneValue.type.includes('field:') ? '[data.field]' : ''}.text)
      .filter(fieldText => !excludeValues.includes(fieldText))
      .filter(fieldText => (includeValues.length ? includeValues.some(item => fieldText.includes(item)) : true)),
  );
};\n

${severalValues.type}
const ${severalValuesName} = async function(data: ${severalValues.typeName} = {quantity: 2, ${
    severalValues.type.includes('field:') ? `field: '${finTypedObject(dataObj)._fields[0]}'` : ''
  }}): Promise<string[]> {
  await page.${baseLibraryDescription.waitForVisibilityMethod}(${getWaitForCollectionArgumentTemplate(
    dataObj,
    '>=${data.quantity}',
  )})
  const ${returnTemplate} = await page.${baseLibraryDescription.getDataMethod}(${argumentTemplate});

  const excludeValues = toArray(data.except);
  const includeValues = toArray(data.like);

  return getRandomArrayItem(
    ${lastKey}
      .map(item => item${severalValues.type.includes('field:') ? '[data.field]' : ''}.text)
      .filter(fieldText => !excludeValues.includes(fieldText))
      .filter(fieldText => (includeValues.length ? includeValues.some(item => fieldText.includes(item)) : true)),
    data.quantity);
};\n
`;
}

function getRandomResultsFlows(asActorAndPage, pageInstance) {
  const { systemPropsList } = config.get();

  const pageFields = Object.getOwnPropertyNames(pageInstance);

  const interactionFields = pageFields.filter(field => !systemPropsList.includes(field));

  const randomResultData = interactionFields
    .filter(field => getPathesToCollections(pageInstance[field], field))
    .flatMap(field => toRandomTemplateFormat(getPathesToCollections(pageInstance[field], field)));

  return randomResultData.reduce((flows, dataObject) => {
    return `${flows}${createFlowTemplates(asActorAndPage, dataObject)}`;
  }, '');
}

export { getRandomResultsFlows };
