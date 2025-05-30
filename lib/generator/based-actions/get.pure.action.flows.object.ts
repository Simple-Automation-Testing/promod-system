/* eslint-disable unicorn/prefer-set-has, sonarjs/no-duplicated-branches, sonarjs/no-nested-template-literals, no-console, sonarjs/cognitive-complexity */
import { isNotEmptyArray, toArray } from 'sat-utils';
import { config } from '../../config/config';
import { getActionInstanceFields } from '../utils';
import { getPageActionMethodNames, redefineActionsMethodName } from '../namings';

const { repeatingActions = [], resultActionsMap, baseLibraryDescription = {}, prettyMethodName = {} } = config.get();

function checkActionExist(page, action) {
  if (!page[action]) {
    throw new Error(`Action "${action}" does not exist. ${page[baseLibraryDescription.entityId]}`);
  }
}

function createFlowTemplateForPageElements({ action, page, nameElements }) {
  const isRepeatingAllowed = isNotEmptyArray(repeatingActions) && repeatingActions.includes(action);

  const actions = {};

  actions[nameElements] = isRepeatingAllowed
    ? async (data, ...rest) => {
        for (const actionData of toArray(data)) {
          checkActionExist(page, action);
          await page[action](actionData, ...rest);
        }
      }
    : async (data, ...rest) => {
        checkActionExist(page, action);
        return await page[action](data, ...rest);
      };

  return redefineActionsMethodName(actions);
}

function createFlowTemplates({ name, action, field, page }) {
  const isActionVoid = resultActionsMap[action] === 'void';

  const isRepeatingAllowed = isNotEmptyArray(repeatingActions) && repeatingActions.includes(action) && isActionVoid;

  const actions = {};

  if (isRepeatingAllowed) {
    actions[name] = async (data, opts) => {
      for (const actionData of toArray(data)) {
        checkActionExist(page, action);
        await page[action]({ [field]: actionData }, opts);
      }
    };
  } else if (isActionVoid) {
    actions[name] = async (data, opts) => {
      checkActionExist(page, action);
      return await page[action]({ [field]: data }, opts);
    };
  } else {
    actions[name] = async (data, opts) => {
      checkActionExist(page, action);
      const { [field]: res } = await page[action]({ [field]: data }, opts);
      return res;
    };
  }

  return redefineActionsMethodName(actions);
}

function getPureActionFlowsObject(asActorAndPage: string, instance: object, action: string) {
  const { elementFields, fragmentFields, collectionsFields } = getActionInstanceFields(instance, action);
  const prettyFlowActionNamePart = prettyMethodName[action] || action;

  return [...fragmentFields, ...collectionsFields].reduce(
    (template, fragmentFieldName) => {
      const instanceFieldIdentifier = instance[fragmentFieldName][baseLibraryDescription.entityId];

      const { flowChildActionName } = getPageActionMethodNames(
        asActorAndPage,
        prettyFlowActionNamePart,
        instanceFieldIdentifier,
      );

      const actions = createFlowTemplates({
        name: flowChildActionName,
        action,
        field: fragmentFieldName,
        page: instance,
      });

      template = { ...template, ...actions };

      return template;
    },
    elementFields.length
      ? createFlowTemplateForPageElements({
          page: instance,
          action,
          nameElements: getPageActionMethodNames(asActorAndPage, prettyFlowActionNamePart).flowElementsActionName,
        })
      : {},
  );
}

export { getPureActionFlowsObject };
