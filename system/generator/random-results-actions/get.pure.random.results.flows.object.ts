/* eslint-disable sonarjs/no-nested-template-literals, sonarjs/cognitive-complexity*/
import { camelize, toArray, getRandomArrayItem } from 'sat-utils';
import { config } from '../../config/config';
import { getCollectionsPathes } from '../check.that.action.exists';
import { getResultMappedResult, getActionsList, getName, addDescriptions } from '../utils.random';

const { baseLibraryDescription = {}, baseResultData = [] } = config.get();

function createFlowTemplates(asActorAndPage, actionDescriptor, page) {
  const { action, /* __countResult, */ _fields } = actionDescriptor || {};

  // TODO this should be refactored and reused
  const randomData = camelize(`${asActorAndPage} get random data from ${getName(action)}`);
  const oneValue = camelize(`${asActorAndPage} get random field value from ${getName(action)}`);
  const severalValues = camelize(`${asActorAndPage} get several random field values from ${getName(action)}`);

  const actions = {};

  if (_fields?.length) {
    actions[randomData] = async (_field = _fields[0], descriptions = {}) => {
      await page[baseLibraryDescription.waitForVisibilityMethod](
        addDescriptions({ length: '>0', ...descriptions }, action),
      );

      const result = await page[baseLibraryDescription.getDataMethod](
        addDescriptions(
          descriptions,
          action,
          _field.reduce((act, k) => {
            act[k] = null;

            return act;
          }, {}),
        ),
      );
      const flatResult = getResultMappedResult(result, action);

      return getRandomArrayItem(
        flatResult.map(item =>
          _field.reduce((requredData, k) => {
            requredData[k] = toArray(baseResultData).includes('text') ? item[k].text : item[k];

            return requredData;
          }, {}),
        ),
      );
    };
  }

  actions[oneValue] = _fields?.length
    ? async (_field, descriptions = {}) => {
        await page[baseLibraryDescription.waitForVisibilityMethod](addDescriptions(descriptions, action), {
          everyArrayItem: false,
        });

        const result = await page[baseLibraryDescription.getDataMethod](addDescriptions(descriptions, action));
        const flatResult = getResultMappedResult(result, action);

        return getRandomArrayItem(
          flatResult.map(item => (toArray(baseResultData).includes('text') ? item[_field].text : item[_field])),
        );
      }
    : async (descriptions = {}) => {
        await page[baseLibraryDescription.waitForVisibilityMethod](addDescriptions(descriptions, action), {
          everyArrayItem: false,
        });

        const result = await page[baseLibraryDescription.getDataMethod](addDescriptions(descriptions, action));
        const flatResult = getResultMappedResult(result, action);

        return getRandomArrayItem(
          flatResult.map(item => (toArray(baseResultData).includes('text') ? item.text : item)),
        );
      };

  actions[severalValues] = _fields?.length
    ? async (_field = _fields[0], quantity = 2, descriptions = {}) => {
        await page[baseLibraryDescription.waitForVisibilityMethod](
          addDescriptions({ length: '>0', ...descriptions }, action),
        );

        const result = await page[baseLibraryDescription.getDataMethod](
          addDescriptions(
            descriptions,
            action,
            _field.reduce((act, k) => {
              act[k] = null;

              return act;
            }, {}),
          ),
        );
        const flatResult = getResultMappedResult(result, action);

        return getRandomArrayItem(
          flatResult.map(item =>
            _field.reduce((requredData, k) => {
              requredData[k] = toArray(baseResultData).includes('text') ? item[k].text : item[k];

              return requredData;
            }),
          ),
          quantity,
        );
      }
    : async (quantity = 2, descriptions = {}) => {
        await page[baseLibraryDescription.waitForVisibilityMethod](
          addDescriptions({ length: '>0', ...descriptions }, action),
        );

        const result = await page[baseLibraryDescription.getDataMethod](addDescriptions(descriptions, action));
        const flatResult = getResultMappedResult(result, action);

        return getRandomArrayItem(
          flatResult.map(item => (toArray(baseResultData).includes('text') ? item.text : item)),
          quantity,
        );
      };

  return actions;
}

function getPureRandomResultsFlowsObject(asActorAndPage, pageInstance) {
  const data = getCollectionsPathes(pageInstance);

  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    const data = createFlowTemplates(asActorAndPage, dataObject, pageInstance);

    flows = { ...flows, ...data };

    return flows;
  }, {});
}

export { getPureRandomResultsFlowsObject };
