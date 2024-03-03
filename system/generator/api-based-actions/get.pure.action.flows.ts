/* eslint-disable sonarjs/no-duplicated-branches */
/* eslint-disable sonarjs/no-nested-template-literals, no-console, sonarjs/cognitive-complexity */
import { camelize, isArray, isNotEmptyArray } from 'sat-utils';
import { config } from '../../config/config';
import { getFragmentTypes } from '../get.instance.elements.type';
import { checkThatInstanceHasActionItems } from '../check.that.action.exists';
import { checkThatElementHasAction, isBaseElement } from '../get.base';
import { getInstanceInteractionFields } from '../utils';

const {
  actionWithWaitOpts,
  repeatingActions = [],
  baseLibraryDescription = {},
  promod,
  prettyMethodName = {},
} = config.get();

function getTemplatedCode({ name, flowResultType, optionsSecondArgument, action, field }) {
  const isActionVoid = flowResultType === 'void';
  const isRepeatingAllowed = isNotEmptyArray(repeatingActions) && repeatingActions.includes(action) && isActionVoid;
  const additionalArguments = optionsSecondArgument ? ', opts' : '';

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
    flowBody = `for (const actionData of toArray(data)) {
      await ${
        baseLibraryDescription.getPageInstance ? `${baseLibraryDescription.getPageInstance}().` : 'page.'
      }${action}({ ${field}: actionData }${additionalArguments})
    }`;
  }

  const isDeclaration = promod.actionsDeclaration === 'declaration';
  const firstLine = isDeclaration ? `async function ${name}(data${optionsSecondArgument}) {` : `const ${name} = async function(data${optionsSecondArgument}) {`;

  return `
${firstLine}
    ${flowBody}
  };`;
}

function createFlowTemplates(name, action, field, instance) {
  const flowResultType = getFragmentTypes(instance, action, 'resultType');

  let optionsSecondArgument = '';
  if (actionWithWaitOpts.includes(action)) {
    optionsSecondArgument = `, opts?`;
  } else if (baseLibraryDescription.generalActionOptionsId) {
    optionsSecondArgument = `, opts?`;
  }

  return getTemplatedCode({ name, flowResultType, optionsSecondArgument, action, field });
}

// TODO try to build generic method for page elements and page fragments
function createFlowTemplateForPageElements(name, action) {
  const prettyFlowActionNamePart = prettyMethodName[action] || action;

  const flowActionName = camelize(`${name} ${prettyFlowActionNamePart} PageElements`);

  let optionsSecondArgument = '';
  // TODO need to update duplicated branches
  if (actionWithWaitOpts.includes(action)) {
    optionsSecondArgument = `, opts?`;
  } else if (baseLibraryDescription.generalActionOptionsId) {
    optionsSecondArgument = `, opts?`;
  }

  const isDeclaration = promod.actionsDeclaration === 'declaration';

  const firstLine = isDeclaration
    ? `async function ${flowActionName}(data${optionsSecondArgument}) {`
    : `const ${flowActionName} = async function(data${optionsSecondArgument}) {`;

  return `
${firstLine}
  return await ${
    baseLibraryDescription.getPageInstance ? `${baseLibraryDescription.getPageInstance}().` : 'page.'
  }${action}(data${optionsSecondArgument ? ', opts' : ''});
};\n`;
}

function getPureActionFlows(asActorAndPage: string, instance: object, action: string) {
  const interactionFields = getInstanceInteractionFields(instance);

  const pageElementActions = interactionFields.filter(field => checkThatElementHasAction(instance[field], action));

  const pageFragmentsActions = interactionFields
    .filter(field => !isBaseElement(instance[field]))
    .filter(field => checkThatInstanceHasActionItems(instance[field], action));

  const pageElementAction = pageElementActions.length ? createFlowTemplateForPageElements(asActorAndPage, action) : '';

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

export { createFlowTemplates, getPureActionFlows };
