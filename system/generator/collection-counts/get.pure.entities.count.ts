/* eslint-disable sonarjs/cognitive-complexity, unicorn/consistent-function-scoping */
import { camelize, stringifyData } from 'sat-utils';
//
import { config } from '../../config/config';
import { getActionsList, getResult, getName } from '../utils.random';
import { getCollectionsPathes } from '../check.that.action.exists';

const { baseLibraryDescription = {}, collectionDescription = {}, promod = {} } = config.get();

function createTemplatePureTemplate(asActorAndPage, actionDescriptor, entryType = '', resultType = '') {
  const { action } = actionDescriptor || {};

  const result = getResult(action);
  const name = camelize(`${asActorAndPage} Get Collection From ${getName(action)}`);

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
  const firstLine = isDeclaration
    ? `async function ${name}(descriptions${entryType} = {})${resultType} {`
    : `const ${name} = async (descriptions${entryType} = {})${resultType} => {`;
  // TODO add better types interactions
  return `
  ${firstLine}
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
