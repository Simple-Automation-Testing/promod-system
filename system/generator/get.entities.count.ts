/* eslint-disable sonarjs/cognitive-complexity, unicorn/consistent-function-scoping */
import { camelize, stringifyData } from 'sat-utils';
import { config } from '../config/config';
import { getActionsList, getResult, getName } from './utils.random';
import { getCollectionsPathes } from './check.that.action.exists';

function createTemplate(asActorAndPage, actionDescriptor) {
  const { baseLibraryDescription = {}, collectionDescription = {}, promod } = config.get();
  const { action, __countResult, __visible = 'any', __where = 'any' } = actionDescriptor || {};

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
  return `
  type T${name}Entry = {
    ${collectionDescription.whereNot || '_whereNot'}?: ${__where} | ${__where}[];
    ${collectionDescription.where || '_where'}?: ${__where} | ${__where}[];
    ${collectionDescription.visible || '_visible'}?: ${__visible} | ${__visible}[];
  }
  type T${name} = ${__countResult}
  ${firstLine}
    const result = await ${
      !baseLibraryDescription.getPageInstance ? 'page.' : `${baseLibraryDescription.getPageInstance}().`
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
