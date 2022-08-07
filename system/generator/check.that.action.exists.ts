/* eslint-disable complexity, sonarjs/cognitive-complexity, no-console*/
import { config } from '../config/config';
import { checkThatElementHasAction } from './get.base';
import { getFragmentInteractionFields } from './utils';
import {
  getCollectionItemInstance,
  isCollectionWithItemBaseElement,
  isCollectionWithItemFragment,
} from './utils.collection';

function checkThatFragmentHasItemsToAction(instance, action: string) {
  const { baseElementsActionsDescription, baseLibraryDescription } = config.get();

  if (isCollectionWithItemBaseElement(instance)) {
    return checkThatElementHasAction(getCollectionItemInstance(instance), action);
  }

  if (isCollectionWithItemFragment(instance)) {
    return checkThatFragmentHasItemsToAction(getCollectionItemInstance(instance), action);
  }

  const interactionFields = getFragmentInteractionFields(instance);

  let result = false;
  for (const fragmentChildFieldName of interactionFields) {
    const childConstructorName = instance[fragmentChildFieldName].constructor.name;

    if (childConstructorName.includes(baseLibraryDescription.fragmentId)) {
      result = checkThatFragmentHasItemsToAction(instance[fragmentChildFieldName], action);

      if (result) return result;
    } else if (isCollectionWithItemFragment(instance[fragmentChildFieldName])) {
      const collectionInstance = getCollectionItemInstance(instance[fragmentChildFieldName]);

      const result = checkThatFragmentHasItemsToAction(collectionInstance, action);

      if (result) return result;
    } else if (isCollectionWithItemBaseElement(instance[fragmentChildFieldName])) {
      result = checkThatElementHasAction(
        instance[fragmentChildFieldName][baseLibraryDescription.collectionItemId]?.name,
        action,
      );
      if (result) return result;
    } else if (baseElementsActionsDescription[childConstructorName]) {
      result = checkThatElementHasAction(childConstructorName, action);
      if (result) return result;
    }
  }

  return result;
}

export { checkThatFragmentHasItemsToAction };
