import { config } from '../config/config';

function getCollectionTypesImport() {
  const { collectionActionTypes } = config.get();

  const types = Object.values(collectionActionTypes);
  if (types.length === 1) return `${types[0]}, `;

  return types.reduce((allTypes, itemType) => `${allTypes}, ${itemType},`);
}

function getElementImportType(elementName) {
  const { baseElementsActionsDescription } = config.get();

  const avaliableAtions = Array.from(
    new Set(
      Object.values(baseElementsActionsDescription[elementName])
        .flatMap(actionDescriptors => Object.values(actionDescriptors))
        .values(),
    ),
  );

  return avaliableAtions.reduce((actionTypes, actionType) => `${actionTypes} ${elementName}${actionType},`, ``);
}

function getBaseImport(baseElements) {
  const { baseLibraryDescription } = config.get();
  const uniqBaseElements = Array.from(new Set(baseElements));

  const collectionActionsImportPart = uniqBaseElements.includes(baseLibraryDescription.collectionId)
    ? `${getCollectionTypesImport()}`
    : '';

  return uniqBaseElements
    .filter(item => item !== baseLibraryDescription.collectionId)
    .reduce(
      (importString, element) => `${importString}\n  ${getElementImportType(element)}`,
      `${baseLibraryDescription.waitOptionsId}, ${collectionActionsImportPart}`,
    );
}

export { getBaseImport };
