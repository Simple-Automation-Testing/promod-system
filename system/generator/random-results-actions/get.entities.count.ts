/* eslint-disable sonarjs/cognitive-complexity, unicorn/consistent-function-scoping */
import { camelize, stringifyData } from 'sat-utils';
import { config } from '../../config/config';
import { getActionsList, getResult, getName } from '../utils.random';
import { getCollectionsPathes } from '../check.that.action.exists';

const { baseLibraryDescription = {}, collectionDescription = {}, promod = {} } = config.get();

function createTemplate(asActorAndPage, actionDescriptor) {
  const { action, __countResult, _type } = actionDescriptor || {};

  const result = getResult(action);
  const name = camelize(`${asActorAndPage} Get Collection From ${getName(action)}`);

  const actionSignature = stringifyData(action).replace(
    `${collectionDescription.action}: null`,
    // TODO this approach should be improved
    `...descriptions, ${collectionDescription.action}: null`,
  );

  const isDeclaration = promod.actionsDeclaration === 'declaration';
  const firstLine = isDeclaration
    ? `async function ${name}({...descriptions}: T${name}Entry = {}): Promise<T${name}[]> {`
    : `const ${name} = async function({...descriptions}: T${name}Entry = {}): Promise<T${name}[]> {`;
  // TODO add better types interactions
  return `
  type T${name}Entry = ${_type.get}
  type T${name} = ${__countResult}
  ${firstLine}
    const result = await ${
      baseLibraryDescription.getPageInstance ? `${baseLibraryDescription.getPageInstance}().` : 'page.'
    }${baseLibraryDescription.getDataMethod}(${actionSignature});

    return result.${result}
  }`;
}

function getCountFlows(pageInstance, asActorAndPage) {
  const data = getCollectionsPathes(pageInstance);
  const actions = getActionsList(data);

  return actions.reduce((flows, dataObject) => {
    return `${flows}\n${createTemplate(asActorAndPage, dataObject)}`;
  }, '');
}

export { getCountFlows };
