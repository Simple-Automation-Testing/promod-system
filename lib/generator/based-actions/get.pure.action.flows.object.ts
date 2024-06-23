/* eslint-disable unicorn/prefer-set-has, sonarjs/no-duplicated-branches, sonarjs/no-nested-template-literals, no-console, sonarjs/cognitive-complexity */
import { camelize, isNotEmptyArray, toArray } from 'sat-utils';
import { config } from '../../config/config';
import { getActionInstanceFields } from '../utils';

const { repeatingActions = [], resultActionsMap, baseLibraryDescription = {}, prettyMethodName = {} } = config.get();

function createFlowTemplateForPageElements({ action, page, nameElements }) {
  const isRepeatingAllowed = isNotEmptyArray(repeatingActions) && repeatingActions.includes(action);

  const actions = {};

  actions[nameElements] = isRepeatingAllowed
    ? async (data, ...rest) => {
        for (const actionData of toArray(data)) {
          await page[action](actionData, ...rest);
        }
      }
    : async (data, ...rest) => {
        return await page[action](data, ...rest);
      };

  return actions;
}

function createFlowTemplates({ name, action, field, page }) {
  const isActionVoid = resultActionsMap[action] === 'void';

  const isRepeatingAllowed = isNotEmptyArray(repeatingActions) && repeatingActions.includes(action) && isActionVoid;

  const actions = {};

  if (isRepeatingAllowed) {
    actions[name] = async (data, opts) => {
      for (const actionData of toArray(data)) {
        await page[action]({ [field]: actionData }, opts);
      }
    };
  } else if (isActionVoid) {
    actions[name] = async (data, opts) => {
      return await page[action]({ [field]: data }, opts);
    };
  } else {
    actions[name] = async (data, opts) => {
      const { [field]: res } = await page[action]({ [field]: data }, opts);
      return res;
    };
  }

  return actions;
}

function getPureActionFlowsObject(asActorAndPage: string, instance: object, action: string) {
  const { elementFields, fragmentFields, collectionsFields } = getActionInstanceFields(instance, action);
  const prettyFlowActionNamePart = prettyMethodName[action] || action;

  return [...fragmentFields, ...collectionsFields].reduce(
    (template, fragmentFieldName) => {
      const instanceFieldIdentifier = instance[fragmentFieldName][baseLibraryDescription.entityId];

      const name = camelize(`${asActorAndPage} ${prettyFlowActionNamePart} ${instanceFieldIdentifier}`);

      const actions = createFlowTemplates({
        name,
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
          nameElements: camelize(`${asActorAndPage} ${prettyFlowActionNamePart} PageElements`),
        })
      : {},
  );
}

export { getPureActionFlowsObject };
