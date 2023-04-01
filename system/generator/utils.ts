import { config } from '../config/config';

function getAllBaseActions() {
  const { baseElementsActionsDescription } = config.get();
  return Array.from(
    new Set(
      Object.keys(baseElementsActionsDescription).flatMap(element =>
        Object.keys(baseElementsActionsDescription[element]),
      ),
    ).values(),
  );
}

function getFragmentInteractionFields(instance) {
  const { systemPropsList } = config.get();
  const instanceOwnKeys = Object.getOwnPropertyNames(instance);

  const iteractionFields = instanceOwnKeys.filter(item => !systemPropsList.includes(item));

  return iteractionFields.length ? iteractionFields : null;
}

export { getAllBaseActions, getFragmentInteractionFields };
