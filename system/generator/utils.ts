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

  return instanceOwnKeys.filter(item => !systemPropsList.includes(item));
}

export { getAllBaseActions, getFragmentInteractionFields };
