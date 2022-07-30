type TConfig = {
  rootLocatorId: string;
  collectionItemId: string;
  getBaseElementFromCollectionByIndex: string;
  entityId: string;
};

function getCollectionElementInstance(collectionInstance, config: TConfig, index = 0) {
  return new collectionInstance[config.collectionItemId](
    collectionInstance[config.rootLocatorId],
    `${collectionInstance[config.entityId]} item ${index}`,
    collectionInstance.rootElements[config.getBaseElementFromCollectionByIndex](index),
  );
}

type TCollectionAction = {
  [key: string]: string;
};
/**
 * @example config
 * const config = {
 * 		action: '_action',
 * 		where: '_where',
 *   	whereNot: '_whereNot',
 *   	visible: '_visible',
 *   	index: '_indexes',
 *   	count: '_count',
 *   	length: 'length',
 * };
 */
function getCollectionActionData(dataObj, config: TCollectionAction): { [k: string]: any; _outOfDescription: any } {
  const copied = { ...dataObj };
  const data: any = {};

  Object.values(config).forEach(key => {
    data[key] = copied[key];
    delete copied[key];
  });

  data['_outOfDescription'] = copied;

  return data;
}

export { getCollectionElementInstance, getCollectionActionData };
