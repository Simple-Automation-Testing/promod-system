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
  if (Array.isArray(dataObj)) {
    return { _outOfDescription: dataObj };
  }

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

export { getCollectionItemInstance } from '../generator/utils.collection';
export { getCollectionActionData };
