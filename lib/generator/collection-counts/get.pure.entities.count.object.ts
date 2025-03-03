/* eslint-disable unicorn/no-object-as-default-parameter, sonarjs/cognitive-complexity, unicorn/consistent-function-scoping */
import { waitFor } from 'sat-wait';
import { compare } from 'sat-compare';
//
import { config } from '../../config/config';
import { getActionsList, getResultMappedResult, addDescriptions } from '../utils.random';
import { getCollectionsPathes } from '../create.type';
import { getCollectionMethodNames, redefineActionsMethodName } from '../namings';

const { baseLibraryDescription = {} } = config.get();

function createTemplateObjectTemplate(asActorAndPage, actionDescriptor, page, ..._rest) {
  const { action } = actionDescriptor || {};

  const { getCollectionFrom, waitCollectionFrom } = getCollectionMethodNames(asActorAndPage, action);

  const actions = {
    [getCollectionFrom]: async (descriptions = {}, opts?) => {
      const result = await page[baseLibraryDescription.getDataMethod](addDescriptions(descriptions, action), opts);

      return getResultMappedResult(result, action);
    },
    [waitCollectionFrom]: async (state, waitingCheckOpts = { isEql: true }, descriptions = {}) => {
      const mergedOpts = {
        everyArrayItem: true,
        allowEmptyArray: false,
        isEql: true,
        timeout: 15_000,
        interval: 2500,
        callEveryCycle: () => ({}),
        message: (t, e) => `Required state was not achived during ${t} ms, error: ${e}`,
        ...waitingCheckOpts,
      };
      await waitFor(
        async () => {
          const actionResult = await actions[getCollectionFrom](descriptions, mergedOpts);

          const { message, result } = compare(actionResult, state, { customCheck: true, ...mergedOpts });

          if (result !== mergedOpts.isEql) {
            throw new Error(message);
          }

          return true;
        },
        { ...mergedOpts },
      );
    },
  };

  return redefineActionsMethodName(actions);
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
