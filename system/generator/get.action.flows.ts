/* eslint-disable sonarjs/no-nested-template-literals, no-console */
import { camelize, isArray, isNotEmptyArray } from 'sat-utils';
import { config } from '../config/config';
import { getElementsTypes, getFragmentTypes } from './get.instance.elements.type';
import { checkThatFragmentHasItemsToAction } from './check.that.action.exists';
import { checkThatElementHasAction } from './get.base';

function getTemplatedCode({ name, typeName, flowArgumentType, flowResultType, optionsSecondArgument, action, field }) {
  const { repeatingActions = [] } = config.get();

  const isActionVoid = flowResultType === 'void';
  const isRepeatingAllowed = isNotEmptyArray(repeatingActions) && repeatingActions.includes(action) && isActionVoid;
  const additionalArguments = optionsSecondArgument ? ', opts' : '';

  let entryDataType = `${typeName}${optionsSecondArgument}`;

  let flowBody = `${
    isActionVoid ? 'return' : `const { ${field} } =`
  } await page.${action}({ ${field}: data }${additionalArguments});${isActionVoid ? '' : `\n\treturn ${field};`}`;

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
    entryDataType = `${typeName} | ${typeName}[]${optionsSecondArgument}`;

    flowBody = `for (const actionData of toArray(data)) {
      await page.${action}({ ${field}: actionData }${additionalArguments})
    }`;
  }

  return `type ${typeName} = ${flowArgumentType}
  const ${name} = async function(data: ${entryDataType}): Promise<${flowResultType}> {
    ${flowBody}
  };`;
}

function createFlowTemplates(name, action, field, instance) {
  const { actionWithWaitOpts, baseLibraryDescription } = config.get();

  const flowArgumentType = getFragmentTypes(instance, action, 'entryType');
  const flowResultType = getFragmentTypes(instance, action, 'resultType');
  const typeName = `T${camelize(`${field} ${action}`)}`;

  const optionsSecondArgument = actionWithWaitOpts.includes(action)
    ? `, opts?: ${baseLibraryDescription.waitOptionsId}`
    : '';

  return getTemplatedCode({ name, typeName, flowArgumentType, flowResultType, optionsSecondArgument, action, field });
}

// TODO try to build generic method for page elements and page fragments
function createFlowTemplateForPageElements(name, action, instance) {
  const { actionWithWaitOpts, baseLibraryDescription, prettyMethodName = {} } = config.get();

  const prettyFlowActionNamePart = prettyMethodName[action] || action;

  const flowArgumentType = getElementsTypes(instance, action, 'entryType');
  const flowResultType = getElementsTypes(instance, action, 'resultType');
  const typeName = `T${camelize(`${name} ${action}`)}`;

  const flowActionName = camelize(`${name} ${prettyFlowActionNamePart} PageElements`);

  const optionsSecondArgument = actionWithWaitOpts.includes(action)
    ? `, opts?: ${baseLibraryDescription.waitOptionsId}`
    : '';

  return `
type ${typeName} = ${flowArgumentType}
const ${flowActionName} = async function(data: ${typeName}${optionsSecondArgument}): Promise<${flowResultType}> {
  return await page.${action}(data${optionsSecondArgument ? ', opts' : ''});
};\n`;
}

function getActionFlows(asActorAndPage: string, instance: object, action: string) {
  const { systemPropsList, prettyMethodName = {}, baseLibraryDescription } = config.get();

  const pageFields = Object.getOwnPropertyNames(instance);
  const interactionFields = pageFields.filter(field => !systemPropsList.includes(field));

  const pageElementActions = interactionFields.filter(field => checkThatElementHasAction(instance[field], action));

  const pageFragmentsActions = interactionFields.filter(field =>
    checkThatFragmentHasItemsToAction(instance[field], action),
  );

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

export { createFlowTemplates, getActionFlows };
