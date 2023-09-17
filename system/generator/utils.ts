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

function getInstanceInteractionFields(instance: { [k: string]: any }, onlyBaseElements?: boolean) {
  const instanceOwnKeys = Object.getOwnPropertyNames(instance);

  const elementsList = Object.keys(baseElementsActionsDescription);
  const baseInterfaces = [baseLibraryDescription.fragmentId, baseLibraryDescription.collectionId];

  return instanceOwnKeys.filter(item => {
    const fieldConstructorName: string = instance[item]?.constructor?.name;
    if (onlyBaseElements) {
      return elementsList.includes(fieldConstructorName);
    }
    return (
      elementsList.includes(fieldConstructorName) ||
      baseInterfaces.some(baseInterface => fieldConstructorName?.endsWith(baseInterface))
    );
  });
}

export { getAllBaseActions, getInstanceInteractionFields };
