/* eslint-disable sonarjs/cognitive-complexity, unicorn/consistent-function-scoping */
import { camelize } from 'sat-utils';
//
import { config } from '../../config/config';
import { getActionsList, getResultMappedResult, addDescriptions, getName } from '../utils.random';
import { getCollectionsPathes } from '../create.type';

const { baseLibraryDescription = {} } = config.get();

function createTemplatePureTemplate(asActorAndPage, actionDescriptor, page, entryType = '', resultType = '') {
  const { action } = actionDescriptor || {};

  const name = camelize(`${asActorAndPage} Get Collection From ${getName(action)}`);

  if (entryType && !entryType.startsWith(':')) {
    throw new Error('entryType should start with ":"');
  }
  if (resultType && !resultType.startsWith(':')) {
    throw new Error('resultType should start with ":"');
  }

  return {
    [name]: async (descriptions = {}) => {
      const result = await page[baseLibraryDescription.getDataMethod](addDescriptions(descriptions, action));

      return getResultMappedResult(result, action);
    },
  };
}

function getPureCountFlowsObject(pageInstance, asActorAndPage) {
  const data = getCollectionsPathes(pageInstance);
  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    const actions = createTemplatePureTemplate(asActorAndPage, dataObject, pageInstance);

    flows = { ...flows, ...actions };

    return flows;
  }, {});
}

export { getPureCountFlowsObject };
