/* eslint-disable sonarjs/no-nested-template-literals, sonarjs/cognitive-complexity*/
import { toArray, getRandomArrayItem } from 'sat-utils';

import { config } from '../../config/config';
import { getResultMappedResult, addDescriptions } from '../utils.random';
import { redefineActionsMethodName, getPageRandomGettersMethodNames } from '../namings';
import { getCollectionFlowObj } from '../based-actions/common';

const { baseLibraryDescription = {}, baseResultData = [] } = config.get();

function createFlowTemplates(asActorAndPage, actionDescriptor, page) {
  const { action, /* _countResult, */ _fields } = actionDescriptor || {};

  const { getRandomDataActionName, getOneValueActionName, getSeveralValuesActionName } =
    getPageRandomGettersMethodNames(asActorAndPage, action);

  const actions = {};

  if (_fields?.length) {
    actions[getRandomDataActionName] = async (_field = [_fields[0]], descriptions = {}) => {
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

    actions[getOneValueActionName] = async (_field, descriptions = {}) => {
      await page[baseLibraryDescription.waitForVisibilityMethod](
        addDescriptions({ ...descriptions, length: '>0' }, action),
        {
          everyArrayItem: false,
        },
      );

      const result = await page[baseLibraryDescription.getDataMethod](
        addDescriptions(descriptions, action, { [_field]: null }),
      );
      const flatResult = getResultMappedResult(result, action);

      return getRandomArrayItem(
        flatResult.map(item => (toArray(baseResultData).includes('text') ? item[_field].text : item[_field])),
      );
    };

    actions[getSeveralValuesActionName] = async (_field = _fields[0], quantity = 2, descriptions = {}) => {
      await page[baseLibraryDescription.waitForVisibilityMethod](
        addDescriptions({ length: '>0', ...descriptions }, action, { [_field]: null }),
      );

      const result = await page[baseLibraryDescription.getDataMethod](
        addDescriptions(descriptions, action, { [_field]: null }),
      );
      const flatResult = getResultMappedResult(result, action);

      return getRandomArrayItem(
        flatResult.map(item => (toArray(baseResultData).includes('text') ? item[_field].text : item[_field])),
        quantity,
      );
    };
  } else {
    actions[getOneValueActionName] = async (descriptions = {}) => {
      await page[baseLibraryDescription.waitForVisibilityMethod](addDescriptions(descriptions, action), {
        everyArrayItem: false,
      });

      const result = await page[baseLibraryDescription.getDataMethod](addDescriptions(descriptions, action));
      const flatResult = getResultMappedResult(result, action);

      return getRandomArrayItem(flatResult.map(item => (toArray(baseResultData).includes('text') ? item.text : item)));
    };

    actions[getSeveralValuesActionName] = async (quantity = 2, descriptions = {}) => {
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
  }

  return redefineActionsMethodName(actions);
}

function getPureRandomResultsFlowsObject(asActorAndPage, pageInstance) {
  return getCollectionFlowObj(asActorAndPage, pageInstance, createFlowTemplates);
}

export { getPureRandomResultsFlowsObject };
