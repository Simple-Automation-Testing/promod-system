import { isObject, camelize } from 'sat-utils';

import { config } from '../config/config';

const { collectionDescription } = config.get();

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

function getPageRandomGettersMethodNames(asActorAndPage: string, action: { [key: string]: any }) {
  const getRandomDataActionName = camelize(`${asActorAndPage} get random data from ${getName(action)}`);
  const getOneValueActionName = camelize(`${asActorAndPage} get random field value from ${getName(action)}`);
  const getSeveralValuesActionName = camelize(
    `${asActorAndPage} get several random field values from ${getName(action)}`,
  );

  return {
    getRandomDataActionName,
    getOneValueActionName,
    getSeveralValuesActionName,
  };
}

function updateActionsMethodName(actions, methodName) {
  Object.defineProperty(actions[methodName], 'name', {
    value: methodName,
    writable: false,
    enumerable: false,
    configurable: true,
  });

  return actions;
}

function redefineActionsMethodName(actions) {
  Object.keys(actions).forEach(key => updateActionsMethodName(actions, key));

  return actions;
}

export {
  getCollectionMethodNames,
  getPageActionMethodNames,
  updateActionsMethodName,
  redefineActionsMethodName,
  getPageRandomGettersMethodNames,
};
