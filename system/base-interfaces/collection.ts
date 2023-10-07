/* eslint-disable sonarjs/cognitive-complexity, unicorn/no-array-method-this-argument, prettier/prettier*/
import {
  isNotEmptyObject,
  isUndefined,
  toArray,
  safeJSONstringify,
  isNotEmptyArray,
  isNumber,
  isObject,
  lengthToIndexesArray,
  getRandomArrayItem,
  isFunction,
} from 'sat-utils';
import { getCollectionElementInstance, getCollectionActionData } from './utils';
import { PromodeSystemCollectionStateError } from './error';

import { promodLogger } from '../logger';
import { config } from '../config';

const collectionItemIndexRg = /(?<=index \[)(\d+)(?=])/gm;

import type { TbaseLibraryDescriptionMap, TcollectionActionDescriptionMap, TelementActionsMap } from './types';

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

class PromodSystemCollection<TrootElements = any, TitemClass = any> {
  protected rootLocator: string;
  protected rootElements: TrootElements;
  protected identifier: string;
  protected CollectionItemClass: TitemClass;
  protected overrideCollectionItems: any[];
  protected parent: any;
  private logger: { log(...args: any[]): void };

  /**
   * @param {!Object} elementActionMap base library element/elements actions
   *
   */
  static updateElementActionsMap(elementActionMap: TelementActionsMap) {
    if (!isObject(elementActionMap)) {
      throw new TypeError('updateElementActionsMap(): expects that elementActionMap be an object');
    }
    Object.assign(elementAction, elementActionMap);
  }

  static updateCollectionActionDescriptor(collectionActionDescriptionMap: TcollectionActionDescriptionMap) {
    if (!isObject(collectionActionDescriptionMap)) {
      throw new TypeError(
        'updateCollectionActionDescriptor(): expects that collectionActionDescriptionMap be an object',
      );
    }
    Object.assign(collectionDescription, collectionActionDescriptionMap);
  }

  static updateBaseLibraryDescription(baseLibraryDescriptionMap: TbaseLibraryDescriptionMap) {
    if (!isObject(baseLibraryDescriptionMap)) {
      throw new TypeError('updateBaseLibraryDescription(): expects that baseLibraryDescriptionMap be an object');
    }
    Object.assign(baseLibraryDescription, baseLibraryDescriptionMap);
  }

  constructor(locator: string, collectionName: string, rootElements: TrootElements, CollectionItemClass: TitemClass) {
    this.rootLocator = locator;
    this.identifier = collectionName;
    this.rootElements = rootElements;
    this.CollectionItemClass = CollectionItemClass;
    this.overrideCollectionItems = [];

    this.logger = collection;
  }

  async getRoot(index: number) {
    return this.rootElements[baseLibraryDescription.getBaseElementFromCollectionByIndex](index);
  }

  set collectionLogger(logger: { log: (...args) => void }) {
    if (!isFunction(logger.log)) {
      throw new TypeError('collectionLogger: logger should have a log method');
    }
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
  async waitLoadedState(methodSignature?: string, ignoreWaiting?: boolean) {}

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

  async get(action, ignoreWaiting?: boolean): Promise<any> {
    return this.gatherDataActionCall(action, 'get', ignoreWaiting);
  }

  async isDisplayed(action) {
    return this.gatherDataActionCall(action, 'isDisplayed');
  }

  async compareContent(compareActionData) {
    const { [collectionDescription.where]: _where, [collectionDescription.whereNot]: _whereNot } = compareActionData;

    const searchData = {};

    if (isNotEmptyObject(_where) || isNotEmptyArray(_where)) {
      searchData['_where'] = _where;
    }

    if (isNotEmptyObject(_whereNot) || isNotEmptyArray(_whereNot)) {
      searchData['_whereNot'] = _whereNot;
    }

    return this.findElementsBySearchParams(searchData, await this.getElements()).then(
      res => {
        /**
         * @info
         * since for get/isDisplayed methods empty array as a call result is allowed
         * we rely on founded result length, if length === 0 - items were not found by search params
         */
        return !!res.length;
      },
      error => {
        this.logger.log('PromodSystemCollection compareContent call with error result ', error);
        return false;
      },
    );
  }

  async compareVisibility(compareActionData) {
    const { [collectionDescription.visible]: _visible } = compareActionData;

    return this.findElementsBySearchParams({ _visible }, await this.getElements()).then(
      res => {
        /**
         * @info
         * since for get/isDisplayed methods empty array as a call result is allowed
         * we rely on founded result length, if length === 0 - items were not found by search params
         */
        return !!res.length;
      },
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
  private async gatherDataActionCall(action, methodSignature: 'get' | 'isDisplayed', ignoreWaiting?: boolean) {
    this.logger.log(`PromodSystemCollection ${methodSignature} action call with data `, action);

    await this.waitLoadedState(methodSignature, ignoreWaiting);

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

    await this.waitLoadedState(methodSignature);

    const { [collectionDescription.action]: _action, ...descriptionInteractionElements } = this.alignActionData(action);

    const { relevantCollection, repeat, reverse } = await this.getInteractionElements(descriptionInteractionElements);

    if (reverse) {
      relevantCollection.reverse();
    }

    if (repeat) {
      for (let collectionItem of relevantCollection) {
        if (collectionItem.getSuccessSearchParams) {
          collectionItem = await this.checkCollectionItemBySearchParams(
            collectionItem,
            collectionItem.getSuccessSearchParams,
          );

          if (isUndefined(collectionItem)) {
            throw new PromodeSystemCollectionStateError(
              `interactionActionCall(): call ${methodSignature} seems to have stale collection, search params do not work ${collectionItem.getSuccessSearchParams}`,
            );
          }
        }

        await collectionItem[methodSignature](_action);
      }
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
   * @param collectionItem
   * @param searchParams
   * @returns
   */
  private async checkCollectionItemBySearchParams(collectionItem, searchParams): Promise<boolean | undefined> {
    const successSearchParamsCombination = [];

    const isRequiredElement = await searchParams.reduce(async (result, compareCallAction) => {
      if (!(await result)) return false;

      for (const searchParamsItem of compareCallAction.searchParams) {
        const currentItemsCount = await this.rootElements[elementAction.count]();

        const partialResult = await collectionItem[compareCallAction.method](searchParamsItem)
          .then(reslt => reslt === compareCallAction.condition)
          .catch((error: Error) => {
            const [matchedIndex] = error.toString().match(collectionItemIndexRg) || [];
            if (matchedIndex && Number(matchedIndex) >= currentItemsCount) {
              throw new PromodeSystemCollectionStateError(
                `checkCollectionItemBySearchParams(): collection seems to be stale, collection length is ${currentItemsCount}, collection item index is ${matchedIndex}`,
              );
            }
            return false === compareCallAction.condition;
          });

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

  /**
   * @private
   *
   * @returns
   */
  private async getInteractionElements(action) {
    const {
      [collectionDescription.where]: _where,
      [collectionDescription.whereNot]: _whereNot,
      [collectionDescription.visible]: _visible,
      [collectionDescription.repeat]: repeat,
      [collectionDescription.reverse]: reverse,
      [collectionDescription.count]: count,
    } = action;

    const findDescription = { _visible, _where, _whereNot };

    const availableElementsCount = isNumber(count) ? count : await this.rootElements[elementAction.count]();
    const availableElementsIndexes = lengthToIndexesArray(availableElementsCount);

    const requiredElements = [];

    if (toArray(action[collectionDescription.index]).length) {
      const indexes = toArray(action[collectionDescription.index]);
      const ignoreIndexes = new Set([]);

      for (const index of indexes) {
        if (isNumber(index) && !ignoreIndexes.has(index)) {
          requiredElements.push(this.getElement(index));
          ignoreIndexes.add(index);
        } else if (index === 'random') {
          const availableIndexes = availableElementsIndexes.filter(index => !ignoreIndexes.has(index));
          const randomIndex = getRandomArrayItem(availableIndexes);
          requiredElements.push(this.getElement(randomIndex));
          ignoreIndexes.add(randomIndex);
        }
      }
    } else {
      requiredElements.push(...lengthToIndexesArray(availableElementsCount).map(index => this.getElement(index)));
    }

    const relevantCollection = await this.findElementsBySearchParams(findDescription, requiredElements);

    return { relevantCollection, repeat, reverse };
  }

  /**
   * @private
   *
   * @returns
   */
  private getElement(index): TitemClass {
    const instance = getCollectionElementInstance(this, baseLibraryDescription, index);

    if (this.overrideCollectionItems.length) {
      instance.overrideBaseMethods(...this.overrideCollectionItems);
    }

    const parent = this;

    instance.setParent = parent;
    instance.setIndex = index;

    return instance;
  }

  /**
   * @private
   *
   * @returns
   */
  private async getElements() {
    await this.waitLoadedState();

    const count = await this.rootElements[elementAction.count]();

    return Array.from({ length: count })
      .map((_item, index) => index)
      .map(requiredIndex => this.getElement(requiredIndex));
  }

  // DATA TRANSFORMATION
  private prepareFind({ _visible, _where, _whereNot }: any = {}) {
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

  /**
   * @private
   *
   * @param {any} action action data
   * @returns {{[k: string]: any}}
   */
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
