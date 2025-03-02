type TelementActionsMap = {
  click: string;
  hover: string;
  focus: string;
  scrollIntoView: string;
  isDisplayed: string;
  count: string;
  get: string;
};

type TcollectionActionDescriptionMap = {
  action: string;
  where: string;
  whereNot: string;
  visible: string;
  repeatActionForEveryFoundElement: string;
  reversFoundElementCollection: string;
  index: string;
  count: string;
  length: string;
};

type TbaseLibraryDescriptionMap = {
  entityId: string;
  rootLocatorId: string;
  pageId: string;
  fragmentId: string;
  collectionId: string;
  waitOptionsId: string;
  collectionActionId: string;
  collectionCheckId: string;
  getDataMethod: string;
  getVisibilityMethod: string;
};

export type { TelementActionsMap, TcollectionActionDescriptionMap, TbaseLibraryDescriptionMap };
