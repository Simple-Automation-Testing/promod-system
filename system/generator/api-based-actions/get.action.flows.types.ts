/* eslint-disable sonarjs/no-nested-template-literals, no-console, sonarjs/cognitive-complexity */
import { isObject, camelize, isArray, isNotEmptyArray } from 'sat-utils';
import { config } from '../../config/config';
import { getElementsTypes, getFragmentTypes } from '../get.instance.elements.type';
import { checkThatInstanceHasActionItems } from '../check.that.action.exists';
import { checkThatElementHasAction, isBaseElement } from '../get.base';
import { getInstanceInteractionFields } from '../utils';

const noTransormTypes = new Set(['void', 'boolean']);

const {
  repeatingActions = [],
  baseLibraryDescription = {},
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

  let entryDataType = `Tentry${optionsSecondArgument}`;

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

  const actionDeclaration = `declare function ${name}<Tentry extends ${typeName}>(data: ${entryDataType}): Promise<${callResultType}>`;

  return `
type ${typeName} = ${flowArgumentType}
type ${typeName}Result = ${resultTypeClarification}
${actionDeclaration};`;
}

function createFlowTemplates(name, action, field, instance) {
  const { actionWithWaitOpts, baseLibraryDescription } = config.get();

  const flowArgumentType = getFragmentTypes(instance, action, 'entryType');
  const flowResultType = getFragmentTypes(instance, action, 'resultType');
  const typeName = `T${camelize(`${field} ${action}`)}`;

  let optionsSecondArgument = '';
  if (actionWithWaitOpts.includes(action)) {
    optionsSecondArgument = `, opts?: ${baseLibraryDescription.waitOptionsId}`;
  } else if (baseLibraryDescription.generalActionOptionsId) {
    optionsSecondArgument = `, opts?: ${baseLibraryDescription.generalActionOptionsId}`;
  }

  return getTemplatedCode({ name, typeName, flowArgumentType, flowResultType, optionsSecondArgument, action, field });
}

// TODO try to build generic method for page elements and page fragments
function createFlowTemplateForPageElements(name, action, instance) {
  const prettyFlowActionNamePart = prettyMethodName[action] || action;

  const flowArgumentType = getElementsTypes(instance, action, 'entryType');
  const flowResultType = getElementsTypes(instance, action, 'resultType');
  const typeName = `T${camelize(`${name} ${action}`)}`;

  const flowActionName = camelize(`${name} ${prettyFlowActionNamePart} PageElements`);

  let optionsSecondArgument = '';
  if (actionWithWaitOpts.includes(action)) {
    optionsSecondArgument = `, opts?: ${baseLibraryDescription.waitOptionsId}`;
  } else if (baseLibraryDescription.generalActionOptionsId) {
    optionsSecondArgument = `, opts?: ${baseLibraryDescription.generalActionOptionsId}`;
  }

  // TODO waiters returns boolean if error was not thrown
  const resultTypeClarification = flowResultType === 'void' && optionsSecondArgument ? 'boolean' : flowResultType;
  const callResultType = shouldResultTypeBeBasedOnArgument(resultTypeClarification, flowArgumentType)
    ? `TresultBasedOnArgument<Tentry, ${typeName}Result>`
    : `${typeName}Result`;

  const actionDeclaration = `declare function ${flowActionName}<Tentry extends ${typeName}>(data: Tentry${optionsSecondArgument}): Promise<${callResultType}>`;

  return `
type ${typeName} = ${flowArgumentType}
type ${typeName}Result = ${resultTypeClarification}
${actionDeclaration};\n`;
}

function getActionFlowsTypes(asActorAndPage: string, instance: object, action: string) {
  const interactionFields = getInstanceInteractionFields(instance);

  const pageElementActions = interactionFields.filter(field => checkThatElementHasAction(instance[field], action));

  const pageFragmentsActions = interactionFields
    .filter(field => !isBaseElement(instance[field]))
    .filter(field => checkThatInstanceHasActionItems(instance[field], action));

  const pageElementAction = pageElementActions.length
    ? createFlowTemplateForPageElements(asActorAndPage, action, instance)
    : '';

  return `
/** ====================== ${action} ================== */
${pageFragmentsActions.reduce(
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

export { createFlowTemplates, getActionFlowsTypes };
