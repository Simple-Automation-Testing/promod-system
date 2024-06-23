/* eslint-disable sonarjs/no-nested-template-literals, no-console, sonarjs/cognitive-complexity */
import { isObject, camelize, isArray, isNotEmptyArray } from 'sat-utils';
import { config } from '../../config/config';
import { getActionInstanceFields } from '../utils';

import { getFlowRestArguments, getFlowTypes } from './common';

const noTransormTypes = new Set(['void', 'boolean']);

const {
  repeatingActions = [],
  baseLibraryDescription = {},
  promod,
  collectionActionTypes,
  prettyMethodName = {},
  actionWithWaitOpts,
} = config.get();

function shouldResultTypeBeBasedOnArgument(resultTypeClarification, argumentType) {
  if (noTransormTypes.has(resultTypeClarification.trim())) {
    return false;
  }

  return !(
    isObject(collectionActionTypes) &&
    Object.values(collectionActionTypes).some(collectionAction => argumentType.startsWith(collectionAction))
  );
}

function getTemplatedCode({ name, typeName, flowArgumentType, flowResultType, optionsSecondArgument, action, field }) {
  const isActionVoid = flowResultType === 'void';
  const isRepeatingAllowed = isNotEmptyArray(repeatingActions) && repeatingActions.includes(action) && isActionVoid;
  const additionalArguments = optionsSecondArgument ? ', opts' : '';

  let entryDataType = `Tentry${optionsSecondArgument}`;

  let flowBody = `${isActionVoid ? 'return' : `const { ${field} } =`} await ${
    baseLibraryDescription.getPageInstance ? `${baseLibraryDescription.getPageInstance}().` : 'page.'
  }${action}({ ${field}: data }${additionalArguments});${isActionVoid ? '' : `\n\treturn ${field};`}`;

  /**
   * @info
   * repeat action is not allowed for actions that return values
   * but for void actions we can repeat action, i.e click, set data to input fieds.
   */
  if (!isRepeatingAllowed && isArray(repeatingActions) && repeatingActions.includes(action)) {
    // TODO use logger here
    console.info(
      `${action} result type is not void, but action exists in 'repeatingActions' list. Repeat is not allowed here`,
    );
  } else if (isRepeatingAllowed) {
    entryDataType = `Tentry | Tentry[]${optionsSecondArgument}`;

    flowBody = `for (const actionData of toArray(data)) {
      await ${
        baseLibraryDescription.getPageInstance ? `${baseLibraryDescription.getPageInstance}().` : 'page.'
      }${action}({ ${field}: actionData }${additionalArguments})
    }`;
  }

  let resultTypeClarification;

  if (flowResultType === 'void' && optionsSecondArgument && actionWithWaitOpts?.includes(action)) {
    resultTypeClarification = 'boolean';
  } else if (
    flowResultType === 'void' &&
    optionsSecondArgument &&
    optionsSecondArgument.includes(baseLibraryDescription.generalActionOptionsId)
  ) {
    resultTypeClarification = 'void';
  } else {
    resultTypeClarification = flowResultType;
  }

  const callResultType = shouldResultTypeBeBasedOnArgument(resultTypeClarification, flowArgumentType)
    ? `TresultBasedOnArgument<Tentry, ${typeName}Result>`
    : `${typeName}Result`;

  const isDeclaration = promod.actionsDeclaration === 'declaration';
  const firstLine = isDeclaration
    ? `async function ${name}<Tentry extends ${typeName}>(data: ${entryDataType}): Promise<${callResultType}> {`
    : `const ${name} = async <Tentry extends ${typeName}>(data: ${entryDataType}): Promise<${callResultType}> => {`;

  return `
type ${typeName} = ${flowArgumentType}
type ${typeName}Result = ${resultTypeClarification}
${firstLine}
    ${flowBody}
  };`;
}

function createFlowTemplates(name, action, field, instance) {
  const { flowArgumentType, flowResultType, typeName } = getFlowTypes(instance, action, field);

  const optionsSecondArgument = getFlowRestArguments(action);

  return getTemplatedCode({ name, typeName, flowArgumentType, flowResultType, optionsSecondArgument, action, field });
}

// TODO try to build generic method for page elements and page fragments
function createFlowTemplateForPageElements(name, action, instance) {
  const prettyFlowActionNamePart = prettyMethodName[action] || action;

  const { flowArgumentType, flowResultType, typeName } = getFlowTypes(instance, action, name, true);

  const flowActionName = camelize(`${name} ${prettyFlowActionNamePart} PageElements`);

  const optionsSecondArgument = getFlowRestArguments(action);

  // TODO waiters returns boolean if error was not thrown
  const resultTypeClarification = flowResultType === 'void' && optionsSecondArgument ? 'boolean' : flowResultType;
  const callResultType = shouldResultTypeBeBasedOnArgument(resultTypeClarification, flowArgumentType)
    ? `TresultBasedOnArgument<Tentry, ${typeName}Result>`
    : `${typeName}Result`;

  const isDeclaration = promod.actionsDeclaration === 'declaration';

  const firstLine = isDeclaration
    ? `async function ${flowActionName}<Tentry extends ${typeName}>(data: Tentry${optionsSecondArgument}): Promise<${callResultType}> {`
    : `const ${flowActionName} = async <Tentry extends ${typeName}>(data: Tentry${optionsSecondArgument}): Promise<${callResultType}> => {`;

  return `
type ${typeName} = ${flowArgumentType}
type ${typeName}Result = ${resultTypeClarification}
${firstLine}
  return await ${
    baseLibraryDescription.getPageInstance ? `${baseLibraryDescription.getPageInstance}().` : 'page.'
  }${action}(data${optionsSecondArgument ? ', opts' : ''});
};\n`;
}

function getActionFlows(asActorAndPage: string, instance: object, action: string) {
  const { elementFields, fragmentFields, collectionsFields } = getActionInstanceFields(instance, action);

  const pageElementAction = elementFields.length
    ? createFlowTemplateForPageElements(asActorAndPage, action, instance)
    : '';

  return `
/** ====================== ${action} ================== */
${[...fragmentFields, ...collectionsFields].reduce(
  (template, fragmentFieldName) => {
    const prettyFlowActionNamePart = prettyMethodName[action] || action;

    const instanceFieldIdentifier = instance[fragmentFieldName][baseLibraryDescription.entityId];

    const name = camelize(`${asActorAndPage} ${prettyFlowActionNamePart} ${instanceFieldIdentifier}`);

    return `${template}\n${createFlowTemplates(name, action, fragmentFieldName, instance[fragmentFieldName])}\n`;
  },
  `\n
`,
)}
${pageElementAction}
/** ====================== ${action} ================== */
`;
}

export { createFlowTemplates, getActionFlows };
