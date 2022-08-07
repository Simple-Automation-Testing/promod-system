/* eslint-disable sonarjs/no-identical-functions */
import { isObject, isString, getType } from 'sat-utils';

const baseLibraryDescriptionExpectedKeys = [
  'entityId',
  'rootLocatorId',
  'pageId',
  'fragmentId',
  'collectionId',
  'collectionItemId',
  'collectionRootElementsId',
  'waitOptionsId',
  'collectionActionId',
  'collectionCheckId',
  'getDataMethod',
  'getVisibilityMethod',
  'getBaseElementFromCollectionByIndex',
];
/**
 * @example {object} baseLibraryDescription
 * {
 * 		entityId: 'identifier',
 * 		rootLocatorId: 'rootLocator',
 * 		pageId: 'Page',
 * 		fragmentId: 'Fragment',
 * 		collectionId: 'Collection',
 * 		collectionItemId: 'InstanceType',
 * 		collectionRootElementsId: 'rootElements',
 * 		waitOptionsId: 'IWaitOpts',
 * 		collectionActionId: 'ICollectionAction',
 * 		collectionCheckId: 'ICollectionCheck',
 * 		getDataMethod: 'get',
 * 		getVisibilityMethod: 'isDisplayed',
 * 		getBaseElementFromCollectionByIndex: 'get'
 * }
 */

function validateBaseLibraryDescription(baseLibraryDescription: { [k: string]: string }) {
  if (!isObject(baseLibraryDescription)) {
    throw new TypeError('"baseLibraryDescription" should be an object');
  }

  baseLibraryDescriptionExpectedKeys.forEach(key => {
    if (!baseLibraryDescription.hasOwnProperty(key)) {
      throw new TypeError(`"baseLibraryDescription" should have "${key}" property`);
    }
    if (!isString(baseLibraryDescription[key])) {
      throw new TypeError(
        `"baseLibraryDescription" should have property "${key}" with value "string", current type is ${getType(
          baseLibraryDescription[key],
        )}`,
      );
    }
  });
}

/**
 * @example {object} collectionActionTypes
 * const collectionActionTypes = {
 *   get: {
 *     where: { action: 'waitForContentState', actionType: 'entryType' },
 *     visible: { action: 'waitForVisibilityState', actionType: 'entryType' },
 *     action: { action: 'get', actionType: 'entryType' },
 *   },
 * };
 */
function validateCollectionActionTypes(collectionActionTypes: {
  [k: string]: { [k: string]: { action: string; actionType: string } };
}) {
  if (!isObject(collectionActionTypes)) {
    throw new TypeError('"collectionActionTypes" should be an object');
  }

  Object.keys(collectionActionTypes).forEach(key => {
    const actionDescriptor = collectionActionTypes[key];

    if (!isObject(actionDescriptor)) {
      throw new TypeError(`"${key}" should be an object, current type ${getType(actionDescriptor)}`);
    }

    Object.keys(actionDescriptor).forEach(actionDescriptorKey => {
      const collectionItemDescriptor = actionDescriptor[actionDescriptorKey];

      if (!isObject(collectionItemDescriptor)) {
        throw new TypeError(
          `"${actionDescriptorKey}" should be an object, current type ${getType(collectionItemDescriptor)}`,
        );
      }

      if (!isString(collectionItemDescriptor.action)) {
        throw new TypeError(`"action" should be a string, current type ${getType(collectionItemDescriptor.action)}`);
      }

      if (!isString(collectionItemDescriptor.actionType)) {
        throw new TypeError(
          `"actionType" should be a string, current type ${getType(collectionItemDescriptor.actionType)}`,
        );
      }
    });
  });
}

/**
 * @example {object} collectionWaitingTypes
 * const collectionWaitingTypes = {
 *   waitForContentState: {
 *     where: { action: 'waitForContentState', actionType: 'entryType' },
 *     visible: { action: 'waitForVisibilityState', actionType: 'entryType' },
 *     action: { action: 'get', actionType: 'entryType' },
 *     compare: { action: 'get', actionType: 'resultType' },
 *   }
 * }
 */

function validateCollectionWaitingTypes(collectionWaitingTypes: {
  [k: string]: { [k: string]: { action: string; actionType: string } };
}) {
  if (!isObject(collectionWaitingTypes)) {
    throw new TypeError('"collectionWaitingTypes" should be an object');
  }

  Object.keys(collectionWaitingTypes).forEach(key => {
    const actionDescriptor = collectionWaitingTypes[key];

    if (!isObject(actionDescriptor)) {
      throw new TypeError(`"${key}" should be an object, current type ${getType(actionDescriptor)}`);
    }

    Object.keys(actionDescriptor).forEach(actionDescriptorKey => {
      const collectionItemDescriptor = actionDescriptor[actionDescriptorKey];

      if (!isObject(collectionItemDescriptor)) {
        throw new TypeError(
          `"${actionDescriptorKey}" should be an object, current type ${getType(collectionItemDescriptor)}`,
        );
      }

      if (!isString(collectionItemDescriptor.action)) {
        throw new TypeError(`"action" should be a string, current type ${getType(collectionItemDescriptor.action)}`);
      }

      if (!isString(collectionItemDescriptor.actionType)) {
        throw new TypeError(
          `"actionType" should be a string, current type ${getType(collectionItemDescriptor.actionType)}`,
        );
      }
    });
  });
}

export { validateBaseLibraryDescription, validateCollectionActionTypes, validateCollectionWaitingTypes };
