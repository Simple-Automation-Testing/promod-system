/* eslint-disable sonarjs/cognitive-complexity, unicorn/consistent-function-scoping */
import { camelize, stringifyData } from 'sat-utils';
import { config } from '../../config/config';
import { getActionsList, getResult, getName } from '../utils.random';
import { getCollectionsPathes } from '../check.that.action.exists';

const { baseLibraryDescription = {}, collectionDescription = {}, promod = {} } = config.get();

function createTemplate(asActorAndPage, actionDescriptor) {
  const { action } = actionDescriptor || {};

  const result = getResult(action);
  const name = camelize(`${asActorAndPage} Get Collection From ${getName(action)}`);

  const actionSignature = stringifyData(action).replace(
    `${collectionDescription.action}: null`,
    // TODO this approach should be improved
    `...descriptions, ${collectionDescription.action}: null`,
  );

  const isDeclaration = promod.actionsDeclaration === 'declaration';
  const firstLine = isDeclaration
    ? `async function ${name}(descriptions = {}) {`
    : `const ${name} = async function(descriptions = {}) {`;
  // TODO add better types interactions
  return `
  ${firstLine}
    const result = await page.${baseLibraryDescription.getDataMethod}(${actionSignature});

    return result.${result}
  }`;
}

function getPureCountFlows(pageInstance, asActorAndPage) {
  const data = getCollectionsPathes(pageInstance);
  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    return `${flows}\n${createTemplate(asActorAndPage, dataObject)}`;
  }, '');
}

export { getPureCountFlows };
