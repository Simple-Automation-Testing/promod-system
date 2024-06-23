/* eslint-disable complexity, sonarjs/cognitive-complexity, no-console*/
import { config } from '../config/config';
import { checkThatElementHasAction, isBaseElement } from './get.base';
import { getInstanceInteractionFields } from './utils';
import {
  getCollectionItemInstance,
  isCollectionWithItemBaseElement,
  isCollectionWithItemFragment,
} from './utils.collection';

const { baseElementsActionsDescription, baseLibraryDescription } = config.get();

function checkThatInstanceHasActionItems(instance, action: string) {
  if (isCollectionWithItemBaseElement(instance)) {
    return checkThatElementHasAction(getCollectionItemInstance(instance), action);
  }

  if (isCollectionWithItemFragment(instance)) {
    return checkThatInstanceHasActionItems(getCollectionItemInstance(instance), action);
  }

  if (isBaseElement(instance)) {
    return checkThatElementHasAction(instance, action);
  }

  const interactionFields = getInstanceInteractionFields(instance);

  return interactionFields.some(field => {
    const fieldConstructorName = instance[field].constructor.name;
    if (fieldConstructorName.includes(baseLibraryDescription.fragmentId)) {
      return checkThatInstanceHasActionItems(instance[field], action);
    } else if (isCollectionWithItemFragment(instance[field]) || isCollectionWithItemBaseElement(instance[field])) {
      const collectionInstance = getCollectionItemInstance(instance[field]);

      return checkThatInstanceHasActionItems(collectionInstance, action);
    } else if (baseElementsActionsDescription[fieldConstructorName]) {
      return checkThatElementHasAction(fieldConstructorName, action);
    }
  });
}

export { checkThatInstanceHasActionItems };
