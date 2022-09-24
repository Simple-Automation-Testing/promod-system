/* eslint-disable sonarjs/cognitive-complexity, unicorn/no-array-method-this-argument, prettier/prettier*/
import { isArray, toArray, safeJSONstringify, isNotEmptyArray, isNumber } from 'sat-utils';
import { promodLogger } from '../logger';
import { getCollectionElementInstance, getCollectionActionData } from './utils';
import { config } from '../config';

const collection = {
  log(...data) {
    promodLogger.promodSystem('[PROMOD SYSTEM COLLECTION]', ...data);
  },
};

const {
  collectionDescription = {
    action: '_action',
    where: '_where',
    whereNot: '_whereNot',
    visible: '_visible',

    repeatActionForEveryFoundElement: '_repeact',
    reversFoundElementCollection: '_reverse',
    index: '_indexes',
    count: '_count',
    length: 'length',
  },
  elementAction = {
    click: 'click',
    hover: 'hover',
    focus: 'focus',
    scrollIntoView: 'scrollIntoView',
    isDisplayed: 'isDisplayed',
    count: 'count',
    get: 'get',
  },
  baseLibraryDescription = {
    entityId: 'identifier',
    rootLocatorId: 'rootLocator',
    pageId: 'Page',
    fragmentId: 'Fragment',
    collectionId: 'Collection',
    collectionItemId: 'CollectionItemClass',
    collectionRootElementsId: 'rootElements',
    waitOptionsId: 'IWaitOpts',
    collectionActionId: 'ICollectionAction',
    collectionCheckId: 'ICollectionCheck',
    getDataMethod: 'get',
    getVisibilityMethod: 'isDisplayed',
    getBaseElementFromCollectionByIndex: 'get',
  },
} = config.get();

class PromodSystemCollection {
  protected rootLocator: string;
  protected rootElements: any;
  protected identifier: any;
  protected CollectionItemClass: any;
  protected overrideCollectionItems: any[];
  protected parent: any;
  private logger: { log(...args: any[]): void };

  static updateElementActionsMap(elementActionMap) {
    Object.assign(elementAction, elementActionMap);
  }

  static updateCollectionDescription(collectionDescriptionMap) {
    Object.assign(collectionDescription, collectionDescriptionMap);
  }

  static updateBaseLibraryDescription(baseLibraryDescriptionMap) {
    Object.assign(baseLibraryDescription, baseLibraryDescriptionMap);
  }

  constructor(locator, collectionName, rootElements, CollectionItemClass) {
    this.rootLocator = locator;
    this.rootElements = rootElements;
    this.identifier = collectionName;
    this.CollectionItemClass = CollectionItemClass;
    this.overrideCollectionItems = [];

    this.logger = collection;
  }

  async getRoot(index) {
    return this.rootElements[baseLibraryDescription.getBaseElementFromCollectionByIndex](index);
  }

  set collectionLogger(logger: { log: (...args) => void }) {
    this.logger = logger;
  }

  set setParent(parent) {
    this.parent = parent;
  }

  /**
   * @override
   */
  async updateRoot() {}

  /**
   * @override
   */
  async waitLoadedState() {}

  overrideChildrenBaseMethods(...methods) {
    this.overrideCollectionItems.push(...methods);
  }

  overrideBaseMethods(...methods) {
    const methodsWhatCanBeOverridden = /^get|action|sendKeys|isDisplayed|compareContent|compareVisibility/;

    for (const method of methods) {
      const { name } = method;
      const [methodToOverride] = name.match(methodsWhatCanBeOverridden) || [];
      if (!methodToOverride) {
        throw new Error(`Element does not have method "${name}".
        PromodSystemCollection available methods to override: get|action|sendKeys|isDisplayed|compareContent|compareVisibility`);
      }

      this[`${methodToOverride}Initial`] = this[methodToOverride];
      this[methodToOverride] = method.bind(this);
    }
  }

  /** PUBLIC */

  async action(action) {
    return this.interactionActionCall(action, 'action');
  }

  async sendKeys(action) {
    return this.interactionActionCall(action, 'sendKeys');
  }

  async get(action): Promise<any> {
    return this.gatherDataActionCall(action, 'get');
  }

  async isDisplayed(action) {
    return this.gatherDataActionCall(action, 'isDisplayed');
  }

  async compareContent(compareActionData) {
    // TODO
    const { _where, ...rest } = compareActionData;
    return this.findElementsBySearchParams({ _where: _where || rest }, await this.getElements()).then(
      res => res,
      error => {
        this.logger.log('PromodSystemCollection compareContent call with error result ', error);
        return false;
      },
    );
  }

  async compareVisibility(compareActionData) {
    // TODO
    const { _visible, ...rest } = compareActionData;
    return this.findElementsBySearchParams({ _visible: _visible || rest }, await this.getElements()).then(
      res => res,
      error => {
        this.logger.log('PromodSystemCollection compareContent call with error result ', error);
        return false;
      },
    );
  }

  /** PRIVATE */

  /**
   * @private
   */
  private async gatherDataActionCall(action, methodSignature: 'get' | 'isDisplayed') {
    this.logger.log(`PromodSystemCollection ${methodSignature} action call with data `, action);

    await this.waitLoadedState();

    const { [collectionDescription.action]: _action, ...descriptionInteractionElements } = this.alignActionData(action);

    const { relevantCollection, reverse } = await this.getInteractionElements(descriptionInteractionElements);

    if (reverse) {
      relevantCollection.reverse();
    }

    const data = [];

    for (const [_index, element] of relevantCollection.entries()) {
      this.logger.log(`PromodSystemCollection ${methodSignature} action call with data `, action);

      data.push(await element[methodSignature](_action));
    }

    return data;
  }

  /**
   * @private
   */
  private async interactionActionCall(action, methodSignature: 'action' | 'sendKeys') {
    this.logger.log(`PromodSystemCollection ${methodSignature} action call with data `, action);

    await this.waitLoadedState();
    const { [collectionDescription.action]: _action, ...descriptionInteractionElements } = this.alignActionData(action);

    const { relevantCollection, repeat, reverse } = await this.getInteractionElements(descriptionInteractionElements);

    if (reverse) {
      relevantCollection.reverse();
    }

    if (repeat) {
    } else {
      await relevantCollection[0][methodSignature](_action);
    }
  }

  /**
   * @private
   *
   * @param {!object} searchParams
   * @param {Array<any>} collectionItems
   * @param {boolean} firstMatchItem
   * @returns
   */
  private async findElementsBySearchParams(
    searchData,
    collectionItems: Array<any>,
    firstMatchItem?: boolean,
  ): Promise<any[]> {
    const { _visible, _where, _whereNot } = searchData;

    const visibilityPart = _visible ? `\nwhere required visibilit state ${safeJSONstringify(_visible)}` : '';
    const wherePart = _where ? `\nwhere required content state ${safeJSONstringify(_where)}` : '';
    const whereNotPart = _whereNot ? `\nwhere required content state should not be ${safeJSONstringify(_where)}` : '';

    this.logger.log('PromodSystemCollection find call with data ', visibilityPart, wherePart, whereNotPart);

    const requiredCollectionItems = [];

    const searchParams = this.prepareFind({ _visible, _where, _whereNot });

    for (const [_index, collectionItem] of collectionItems.entries()) {
      const checkedCollectionItem = await this.checkCollectionItemBySearchParams(collectionItem, searchParams);

      if (checkedCollectionItem) {
        requiredCollectionItems.push(checkedCollectionItem);
        if (firstMatchItem) {
          return requiredCollectionItems;
        }
      }
    }

    return requiredCollectionItems;
  }

  /**
   * @private
   *
   * @returns
   */
  private async getElements() {
    await this.waitLoadedState();

    const count = await this.rootElements[elementAction.count]();

    return await Array.from({ length: count })
      .map((_item, index) => index)
      .map(requiredIndex => this.getElement(requiredIndex));
  }

  /**
   * @private
   *
   * @param collectionItem
   * @param searchParams
   * @returns
   */
  private async checkCollectionItemBySearchParams(collectionItem, searchParams): Promise<boolean | undefined> {
    const successSearchParamsCombination = [];

    const isRequiredElement = await searchParams.reduce(async (result, compareCallAction) => {
      if (!(await result)) return false;

      for (const searchParamsItem of compareCallAction.searchParams) {
        const partialResult = await collectionItem[compareCallAction.method](searchParamsItem)
          .then(reslt => reslt === compareCallAction.condition)
          .catch(() => false === compareCallAction.condition);

        if (partialResult) {
          successSearchParamsCombination.push({
            searchParams: toArray(searchParamsItem),
            method: compareCallAction.method,
            condition: compareCallAction.condition,
          });
          return partialResult;
        }
      }

      return false;
    }, Promise.resolve(true));

    if (isRequiredElement) {
      collectionItem.setSuccessSearchParams = successSearchParamsCombination;

      return collectionItem;
    }
  }

  private async getInteractionElements(action) {
    const {
      [collectionDescription.where]: _where,
      [collectionDescription.whereNot]: _whereNot,
      [collectionDescription.visible]: _visible,
      [collectionDescription.repeat]: repeat,
      [collectionDescription.reverse]: reverse,
    } = action;

    const findDescription = { _visible, _where, _whereNot };

    let requiredElements;

    if (isNumber(action[collectionDescription.count])) {
      requiredElements = await Array.from({ length: action[collectionDescription.count] }).map((_item, index) =>
        this.getElement(index),
      );
    } else if (isNumber(action[collectionDescription.index]) || isArray(action[collectionDescription.index])) {
      requiredElements = await toArray(action[collectionDescription.index]).map(index => this.getElement(index));
    } else {
      requiredElements = await this.getElements();
    }

    const relevantCollection = await this.findElementsBySearchParams(findDescription, requiredElements);

    return { relevantCollection, repeat, reverse };
  }

  getElement(index) {
    const instance = getCollectionElementInstance(this, baseLibraryDescription, index);

    if (this.overrideCollectionItems.length) {
      instance.overrideBaseMethods(...this.overrideCollectionItems);
    }

    const parent = this;

    instance.setParent = parent;
    instance.setIndex = index;

    return instance;
  }

  // DATA TRANSFORMATION
  private prepareFind({ _visible, _where, _whereNot }) {
    return [
      { searchParams: _visible, method: 'compareVisibility', condition: true },
      { searchParams: _where, method: 'compareContent', condition: true },
      { searchParams: _whereNot, method: 'compareContent', condition: false },
    ]
      .map(callCompareDesciptor => ({
        ...callCompareDesciptor,
        searchParams: toArray(callCompareDesciptor.searchParams),
      }))
      .filter(callCompareDesciptor => isNotEmptyArray(callCompareDesciptor.searchParams));
  }

  private alignActionData(action) {
    if (action) {
      const { _outOfDescription, ...rest } = getCollectionActionData(action, collectionDescription);
      return rest;
    } else {
      return { [collectionDescription.action]: null };
    }
  }
}

export { PromodSystemCollection };
