/* eslint-disable unicorn/no-object-as-default-parameter, sonarjs/cognitive-complexity, unicorn/consistent-function-scoping */
import { camelize, waitForCondition, compareToPattern } from 'sat-utils';
//
import { config } from '../../config/config';
import { getActionsList, getResultMappedResult, addDescriptions, getName } from '../utils.random';
import { getCollectionsPathes } from '../create.type';

const { baseLibraryDescription = {} } = config.get();

function createTemplateObjectTemplate(asActorAndPage, actionDescriptor, page, ..._rest) {
  const { action } = actionDescriptor || {};

  // TODO this needs to be common for all actions
  const getCollectionFrom = camelize(`${asActorAndPage} Get Collection From ${getName(action)}`);
  const waitCollectionFrom = camelize(`${asActorAndPage} Wait Content For Collection ${getName(action)}`);

  const actions = {
    [getCollectionFrom]: async (descriptions = {}) => {
      const result = await page[baseLibraryDescription.getDataMethod](addDescriptions(descriptions, action));

      return getResultMappedResult(result, action);
    },
    [waitCollectionFrom]: async (state, waitingCheckOpts = { isEql: true }, descriptions = {}) => {
      await waitForCondition(
        async () => {
          const actionResult = await actions[getCollectionFrom](descriptions);

          const { message, result } = compareToPattern(actionResult, state, { customCheck: true, ...waitingCheckOpts });

          if (result !== waitingCheckOpts.isEql) {
            throw new Error(message);
          }

          return true;
        },
        { message: (t, e) => `Required state was not achived during ${t} ms, error: ${e}`, ...waitingCheckOpts },
      );
    },
  };

  return actions;
}

function getPureCountFlowsObject(pageInstance, asActorAndPage) {
  const data = getCollectionsPathes(pageInstance);
  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    const actions = createTemplateObjectTemplate(asActorAndPage, dataObject, pageInstance);

    flows = { ...flows, ...actions };

    return flows;
  }, {});
}

export { getPureCountFlowsObject };
