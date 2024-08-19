import { isObject, camelize } from 'sat-utils';

import { config } from '../config/config';

const { baseLibraryDescription = {}, collectionDescription } = config.get();

function getName(data) {
  return Object.keys(data).reduce((pattern, key) => {
    if (key === collectionDescription.action) {
      return `${pattern}${isObject(data[key]) ? getName(data[key]) : ''}`;
    }

    return `${pattern} ${key}${isObject(data[key]) ? getName(data[key]) : key}`;
  }, '');
}

function getCollectionMethodNames(asActorAndPage: string, action: { [key: string]: any }) {
  const getCollectionFrom = camelize(`${asActorAndPage} Get Collection From ${getName(action)}`);
  const waitCollectionFrom = camelize(`${asActorAndPage} Wait Content For Collection ${getName(action)}`);

  return {
    getCollectionFrom,
    waitCollectionFrom,
  };
}

function getPageActionMethodNames(asActorAndPage: string, prettyFlowActionNamePart: string, childId?: string) {
  const flowElementsActionName = camelize(`${asActorAndPage} ${prettyFlowActionNamePart} PageElements`);
  const flowChildActionName = childId ? camelize(`${asActorAndPage} ${prettyFlowActionNamePart} ${childId}`) : '';

  return {
    flowElementsActionName,
    flowChildActionName,
  };
}

export { getCollectionMethodNames, getPageActionMethodNames };
