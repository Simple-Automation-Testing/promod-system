/* eslint-disable sonarjs/cognitive-complexity, unicorn/consistent-function-scoping */
import { stringifyData } from 'sat-utils';
//
import { config } from '../../config/config';
import { getActionsList, getResult } from '../utils.random';
import { getCollectionsPathes } from '../create.type';
import { getCollectionMethodNames } from '../namings';

const { baseLibraryDescription = {}, collectionDescription = {}, promod = {} } = config.get();

function createTemplatePureTemplate(asActorAndPage, actionDescriptor, entryType = '', resultType = '') {
  const { action } = actionDescriptor || {};

  const result = getResult(action);

  const { getCollectionFrom, waitCollectionFrom } = getCollectionMethodNames(asActorAndPage, action);

  const actionSignature = stringifyData(action).replace(
    `${collectionDescription.action}: null`,
    // TODO this approach should be improved
    `...descriptions, ${collectionDescription.action}: null`,
  );
  if (entryType && !entryType.startsWith(':')) {
    throw new Error('entryType should start with ":"');
  }
  if (resultType && !resultType.startsWith(':')) {
    throw new Error('resultType should start with ":"');
  }

  const isDeclaration = promod.actionsDeclaration === 'declaration';
  const firstLineGetCollection = isDeclaration
    ? `async function ${getCollectionFrom}(descriptions${entryType} = {})${resultType} {`
    : `const ${getCollectionFrom} = async (descriptions${entryType} = {})${resultType} => {`;

  const firstLineWaitCollection = isDeclaration
    ? `async function ${waitCollectionFrom}(descriptions${entryType} = {})${resultType} {`
    : `const ${waitCollectionFrom} = async (descriptions${entryType} = {})${resultType} => {`;

  // TODO add better types interactions
  return `
  ${firstLineGetCollection}
  const result = await ${
    baseLibraryDescription.getPageInstance ? `${baseLibraryDescription.getPageInstance}().` : 'page.'
  }${baseLibraryDescription.getDataMethod}(${actionSignature});

    return result.${result}
  }`;
}

function getPureCountFlows(pageInstance, asActorAndPage) {
  const data = getCollectionsPathes(pageInstance);
  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    return `${flows}\n${createTemplatePureTemplate(asActorAndPage, dataObject)}`;
  }, '');
}

export { getPureCountFlows, createTemplatePureTemplate };
