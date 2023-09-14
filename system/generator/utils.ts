import { config } from '../config/config';

const { baseElementsActionsDescription, baseLibraryDescription } = config.get();

function getAllBaseActions() {
  return Array.from(
    new Set(
      Object.keys(baseElementsActionsDescription).flatMap(element =>
        Object.keys(baseElementsActionsDescription[element]),
      ),
    ).values(),
  );
}

function getFragmentInteractionFields(instance) {
  const instanceOwnKeys = Object.getOwnPropertyNames(instance);

  const elementsList = Object.keys(baseElementsActionsDescription);
  const baseInterfaces = [baseLibraryDescription.fragmentId, baseLibraryDescription.collectionId];

  const iteractionFields = instanceOwnKeys.filter(item => {
    const fieldConstructorName: string = instance[item]?.constructor?.name;

    return (
      elementsList.includes(fieldConstructorName) ||
      baseInterfaces.some(baseInterface => fieldConstructorName?.endsWith(baseInterface))
    );
  });

  return iteractionFields.length ? iteractionFields : null;
}

export { getAllBaseActions, getFragmentInteractionFields };
