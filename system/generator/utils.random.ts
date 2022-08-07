/* eslint-disable sonarjs/cognitive-complexity */
import { isNotEmptyObject, isEmptyObject } from 'sat-utils';
import { config } from '../config/config';

function isCollectionDescription(data) {
  const { collectionRandomDataDescription } = config.get();

  return isNotEmptyObject(data) && Object.keys(collectionRandomDataDescription).some(key => key in data);
}

function toRandomTemplateFormat(dataItem) {
  const items = [];

  function push(item) {
    items.push(item);
  }

  function iterate(item, entry = 0) {
    let obj = {};

    if (isCollectionDescription(item)) {
      return item;
    }

    for (const key of Object.keys(item)) {
      if (isCollectionDescription(item[key])) {
        obj[key] = { ...item[key] };
        delete item[key];
        return obj;
      } else if (isEmptyObject(item[key])) {
        delete item[key];
      } else {
        if (entry === 0 && isNotEmptyObject(obj)) {
          push(obj);
          obj = {};
        }

        const nestedResult = iterate(item[key], 1);

        if (entry === 0 && isNotEmptyObject(nestedResult)) {
          obj[key] = nestedResult;
          push(obj);
          obj = {};
        } else if (isNotEmptyObject(nestedResult)) {
          obj[key] = nestedResult;
          return obj;
        }

        if (isEmptyObject(item[key])) {
          delete item[key];
        }
      }

      return {};
    }
  }

  do {
    iterate(dataItem);
  } while (isNotEmptyObject(dataItem) && !isCollectionDescription(dataItem));

  return items.filter(item => isNotEmptyObject(item));
}

export { isCollectionDescription, toRandomTemplateFormat };
