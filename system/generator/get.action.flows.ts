/* eslint-disable sonarjs/no-nested-template-literals */
import { camelize } from 'sat-utils';
import { config } from '../config/config';
import { getElementsTypes, getFragmentTypes } from './get.instance.elements.type';
import { checkThatFragmentHasItemsToAction } from './check.that.action.exists';
import { checkThatElementHasAction } from './get.base';

function getTemplatedCode({ name, typeName, flowArgumentType, flowResultType, optionsSecondArgument, action, field }) {
  return `type ${typeName} = ${flowArgumentType}
  const ${name} = async function(data: ${typeName}${optionsSecondArgument}): Promise<${flowResultType}> {
    ${flowResultType === 'void' ? 'return' : `const { ${field} } =`} await page.${action}({ ${field}: data }${
    optionsSecondArgument ? ', opts' : ''
  });${flowResultType === 'void' ? '' : `\n\treturn ${field};`}
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
