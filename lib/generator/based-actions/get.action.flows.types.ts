/* eslint-disable sonarjs/no-nested-template-literals, no-console, sonarjs/cognitive-complexity */
import { isArray, isNotEmptyArray, camelize } from 'sat-utils';
import { config } from '../../config/config';
import { getActionInstanceFields } from '../utils';
import { getPageActionMethodNames } from '../namings';
import { getFragmentTypeReference } from '../fragment-types';

import { getFlowRestArguments, getFlowTypes, shouldResultTypeBeBasedOnArgument } from './common';

const { repeatingActions = [], baseLibraryDescription = {}, prettyMethodName = {}, actionWithWaitOpts } = config.get();

interface TypeGenerationOptions {
  /** When true, generates inline types. When false, references fragment types. */
  inlineTypes?: boolean;
}

function getTemplatedCode({ name, typeName, flowArgumentType, flowResultType, optionsSecondArgument, action, field }) {
  const isActionVoid = flowResultType === 'void';

  const isRepeatingAllowed = isNotEmptyArray(repeatingActions) && repeatingActions.includes(action) && isActionVoid;

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

  const baseOnArg = shouldResultTypeBeBasedOnArgument(resultTypeClarification, flowArgumentType);

  let entryDataType = baseOnArg ? `Tentry${optionsSecondArgument}` : `${typeName}${optionsSecondArgument}`;
  const entryGeneric = baseOnArg ? `<Tentry extends ${typeName}>` : '';

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
    entryDataType = baseOnArg
      ? `Tentry | Tentry[]${optionsSecondArgument}`
      : `${typeName} | ${typeName}[]${optionsSecondArgument}`;
  }

  const callResultType = baseOnArg ? `TresultBasedOnArgument<Tentry, ${typeName}Result>` : `${typeName}Result`;

  const actionDeclaration = `declare function ${name}${entryGeneric}(data: ${entryDataType}): Promise<${callResultType}>`;

  return `
type ${typeName} = ${flowArgumentType}
type ${typeName}Result = ${resultTypeClarification}
${actionDeclaration};`;
}

function createFlowTemplates(name, action, field, instance) {
  const { flowArgumentType, flowResultType, typeName } = getFlowTypes(instance, action, field);

  const optionsSecondArgument = getFlowRestArguments(action);

  return getTemplatedCode({
    name,
    typeName,
    flowArgumentType,
    flowResultType,
    optionsSecondArgument,
    action,
    field,
  });
}

// TODO try to build generic method for page elements and page fragments
function createFlowTemplateForPageElements(name, action, instance) {
  const prettyFlowActionNamePart = prettyMethodName[action] || action;

  const { flowArgumentType, flowResultType, typeName } = getFlowTypes(instance, action, name, true);

  const { flowElementsActionName } = getPageActionMethodNames(name, prettyFlowActionNamePart);

  const optionsSecondArgument = getFlowRestArguments(action);

  // TODO waiters returns boolean if error was not thrown
  const resultTypeClarification = flowResultType === 'void' && optionsSecondArgument ? 'boolean' : flowResultType;

  const callResultType = shouldResultTypeBeBasedOnArgument(resultTypeClarification, flowArgumentType)
    ? `TresultBasedOnArgument<Tentry, ${typeName}Result>`
    : `${typeName}Result`;

  const actionDeclaration = `declare function ${flowElementsActionName}<Tentry extends ${typeName}>(data: Tentry${optionsSecondArgument}): Promise<${callResultType}>`;

  return `
type ${typeName} = ${flowArgumentType}
type ${typeName}Result = ${resultTypeClarification}
${actionDeclaration};\n`;
}

function getActionFlowsTypes(asActorAndPage: string, instance: object, action: string) {
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
    const { flowChildActionName } = getPageActionMethodNames(
      asActorAndPage,
      prettyFlowActionNamePart,
      instanceFieldIdentifier,
    );

    return `${template}\n${createFlowTemplates(
      flowChildActionName,
      action,
      fragmentFieldName,
      instance[fragmentFieldName],
    )}\n`;
  },
  `\n
`,
)}
${pageElementAction}
/** ====================== ${action} ================== */
`;
}

/**
 * Generates function declarations that directly reference fragment types (no intermediate aliases)
 */
function getTemplatedCodeWithFragmentRef({
  name,
  fragmentId,
  action,
  optionsSecondArgument,
  flowResultType,
}: {
  name: string;
  fragmentId: string;
  action: string;
  optionsSecondArgument: string;
  flowResultType: string;
}) {
  const entryTypeName = getFragmentTypeReference(fragmentId, action, 'Entry');
  const resultTypeName = getFragmentTypeReference(fragmentId, action, 'Result');

  const isActionVoid = flowResultType === 'void';

  let resultTypeClarification: string;
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

  const isRepeatingAllowed = isNotEmptyArray(repeatingActions) && repeatingActions.includes(action) && isActionVoid;

  // Determine the actual result type to use
  const actualResultType =
    resultTypeClarification === 'void' || resultTypeClarification === 'boolean'
      ? resultTypeClarification
      : resultTypeName;

  let entryDataType: string;
  let callResultType: string;
  let entryGeneric: string;

  const baseOnArg = shouldResultTypeBeBasedOnArgument(resultTypeClarification, entryTypeName);

  if (baseOnArg) {
    entryDataType = isRepeatingAllowed
      ? `Tentry | Tentry[]${optionsSecondArgument}`
      : `Tentry${optionsSecondArgument}`;
    entryGeneric = `<Tentry extends ${entryTypeName}>`;
    callResultType = `TresultBasedOnArgument<Tentry, ${actualResultType}>`;
  } else {
    entryDataType = isRepeatingAllowed
      ? `${entryTypeName} | ${entryTypeName}[]${optionsSecondArgument}`
      : `${entryTypeName}${optionsSecondArgument}`;
    entryGeneric = '';
    callResultType = actualResultType;
  }

  // Directly use fragment types in function declaration - no intermediate aliases
  return `declare function ${name}${entryGeneric}(data: ${entryDataType}): Promise<${callResultType}>;`;
}

/**
 * Creates flow templates using fragment type references
 */
function createFlowTemplatesWithFragmentRef(
  name: string,
  action: string,
  fragmentId: string,
  fieldName: string,
  instance: object,
) {
  const optionsSecondArgument = getFlowRestArguments(action);
  const { flowResultType } = getFlowTypes(instance, action, fieldName);

  return getTemplatedCodeWithFragmentRef({
    name,
    fragmentId,
    action,
    optionsSecondArgument,
    flowResultType,
  });
}

/**
 * Gets action flow types using fragment type references
 * This is the new approach that reuses fragment types at function level
 */
function getActionFlowsTypesWithFragmentRef(asActorAndPage: string, instance: object, action: string) {
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
    const { flowChildActionName } = getPageActionMethodNames(
      asActorAndPage,
      prettyFlowActionNamePart,
      instanceFieldIdentifier,
    );

    return `${template}\n${createFlowTemplatesWithFragmentRef(
      flowChildActionName,
      action,
      instanceFieldIdentifier,
      fragmentFieldName,
      instance[fragmentFieldName],
    )}\n`;
  },
  `\n
`,
)}
${pageElementAction}
/** ====================== ${action} ================== */
`;
}

export {
  createFlowTemplates,
  getActionFlowsTypes,
  createFlowTemplatesWithFragmentRef,
  getActionFlowsTypesWithFragmentRef,
  TypeGenerationOptions,
};
