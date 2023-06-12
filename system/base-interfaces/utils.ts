type TConfig = {
  rootLocatorId: string;
  collectionItemId: string;
  getBaseElementFromCollectionByIndex: string;
  entityId: string;
};

/**
 * @param {Object} collectionInstance collection object instance
 * @param {Object} config config
 * @param {number} index index in elements lust
 * @returns {Object} collection child instance
 */
function getCollectionElementInstance(collectionInstance, config: TConfig, index = 0) {
  return new collectionInstance[config.collectionItemId](
    collectionInstance[config.rootLocatorId],
    `${collectionInstance[config.entityId]} index [${index}]`,
    collectionInstance.rootElements[config.getBaseElementFromCollectionByIndex](index),
  );
}

type TCollectionAction = {
  [key: string]: string;
};
/**
 * @example config
 * const config = {
 *   action: '_action',
 *   where: '_where',
 *   repeatActionForEveryFoundElement: '_forAll',
 *   reversFoundElementCollection: '_reverse',
 *   whereNot: '_whereNot',
 *   visible: '_visible',
 *   index: '_indexes',
 *   count: '_count',
 *   length: 'length',
 * };
 */
function getCollectionActionData(
  dataObj,
  collectionDescription: TCollectionAction,
): { [k: string]: any; _outOfDescription: any } {
  const copied = { ...dataObj };

  /**
   * !@info - remove array length and collection comparison object or array
   */
  delete copied.length;

  const data: any = {};

  Object.values(collectionDescription).forEach(key => {
    data[key] = copied[key];
    delete copied[key];
  });

  data['_outOfDescription'] = copied;

  return data;
}

export { getCollectionElementInstance, getCollectionActionData };
