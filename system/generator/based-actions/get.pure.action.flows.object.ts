/* eslint-disable sonarjs/no-duplicated-branches, sonarjs/no-nested-template-literals, no-console, sonarjs/cognitive-complexity */
import { camelize, isNotEmptyArray, toArray } from 'sat-utils';
import { config } from '../../config/config';
import { getFragmentTypes } from '../get.instance.elements.type';
import { checkThatInstanceHasActionItems } from '../check.that.action.exists';
import { checkThatElementHasAction, isBaseElement } from '../get.base';
import { getInstanceInteractionFields } from '../utils';

const { repeatingActions = [], baseLibraryDescription = {}, prettyMethodName = {} } = config.get();

function getTemplatedCode({ name, nameElements, flowResultType, action, field, page }) {
  const isActionVoid = flowResultType === 'void';
  const isRepeatingAllowed = isNotEmptyArray(repeatingActions) && repeatingActions.includes(action) && isActionVoid;

  const fnFragments =
    isRepeatingAllowed || isActionVoid
      ? async (data, opts) => {
          for (const actionData of toArray(data)) {
            await page[action]({ [field]: actionData }, opts);
          }
        }
      : async (data, opts) => {
          const { [field]: res } = await page[action]({ [field]: data }, opts);

          return res;
        };

  const actions = {
    [name]: fnFragments,
  };
  if (nameElements) {
    const fnElements =
      isRepeatingAllowed || isActionVoid
        ? async (data, opts) => {
            for (const actionData of toArray(data)) {
              await page[action](actionData, opts);
            }
          }
        : async (data, opts) => {
            return await page[action](data, opts);
          };

    actions[nameElements] = fnElements;
  }

  return actions;
}

function createFlowTemplates(name, action, field, instance, nameElements) {
  const flowResultType = getFragmentTypes(instance, action, 'resultType');

  return getTemplatedCode({ name, nameElements, flowResultType, action, field, page: instance });
}

function getPureActionFlowsObject(asActorAndPage: string, instance: object, action: string) {
  const interactionFields = getInstanceInteractionFields(instance);

  const pageElementActions = interactionFields.filter(field => checkThatElementHasAction(instance[field], action));

  const pageFragmentsActions = interactionFields
    .filter(field => !isBaseElement(instance[field]))
    .filter(field => checkThatInstanceHasActionItems(instance[field], action));

  return pageFragmentsActions.reduce((template, fragmentFieldName) => {
    const prettyFlowActionNamePart = prettyMethodName[action] || action;

    const instanceFieldIdentifier = instance[fragmentFieldName][baseLibraryDescription.entityId];

    const name = camelize(`${asActorAndPage} ${prettyFlowActionNamePart} ${instanceFieldIdentifier}`);

    const actions = createFlowTemplates(
      name,
      action,
      fragmentFieldName,
      instance[fragmentFieldName],
      pageElementActions.length ? camelize(`${name} ${prettyFlowActionNamePart} PageElements`) : null,
    );

    template = { ...template, ...actions };

    return template;
  }, {});
}

export { getPureActionFlowsObject };
