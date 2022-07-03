/* eslint-disable sonarjs/cognitive-complexity, unicorn/no-array-method-this-argument, prettier/prettier*/
import { isArray, toArray, isNotEmptyObject, safeJSONstringify, isNumber, isBoolean, isUndefined } from 'sat-utils';
import { promodLogger } from '../logger';

import { getConfiguration } from '../config/config';

const collection = {
  log(...data) {
    promodLogger.promodSystem('[PROMOD SYSTEM COLLECTION]', ...data);
  },
};

const { elementAction = {}, baseLibraryDescription = {} } = getConfiguration();

class PromodSystemCollection<BaseLibraryElementsType = any> {
  protected rootLocator: string;
  protected rootElements: BaseLibraryElementsType;
  protected identifier: any;
  protected CollectionItemClass: any;
  protected overrideCollectionItems: any[];
  protected parent: any;

  private logger: { log(...args: any[]): void };

  static updateElementActionsMap(elementActionMap) {
    Object.assign(elementAction, elementActionMap);
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

  private alignActionData(action) {
    if (action) {
      const { _indexes, _count, _action, _where, _visible, _whereNot, ...description } = action;
      return { _action, _indexes, _count, _where, _visible, _whereNot };
    } else {
      return { _action: null };
    }
  }

  async action(action) {
    await this.waitLoadedState();
    const { _action, ...descriptionInteractionElements } = this.alignActionData(action);

    const elements = await this.getInteractionElements(descriptionInteractionElements);

    await elements[0].action(_action);
  }

  async sendKeys(action) {
    this.logger.log('PromodSystemCollection sendKeys action call with data ', action);

    await this.waitLoadedState();
    const { _action, ...descriptionInteractionElements } = this.alignActionData(action);

    const elements = await this.getInteractionElements(descriptionInteractionElements);

    await elements[0].sendKeys(_action);
  }

  async get(action): Promise<any> {
    this.logger.log('PromodSystemCollection get action call with data ', action);

    await this.waitLoadedState();
    const { _action, ...descriptionInteractionElements } = this.alignActionData(action);

    const elements = await this.getInteractionElements(descriptionInteractionElements);

    const count = elements.length;

    const data = [];

    for (let getDataIndex = 0; getDataIndex < count; getDataIndex++) {
      data.push(await elements[getDataIndex].get(_action));
    }
    return data;
  }

  async isDisplayed(action) {
    this.logger.log('PromodSystemCollection isDisplayed action call with data ', action);

    await this.waitLoadedState();
    const { _action, ...descriptionInteractionElements } = this.alignActionData(action);

    const elements = await this.getInteractionElements(descriptionInteractionElements);

    const count = elements.length;
    const data = [];
    for (let getDataIndex = 0; getDataIndex < count; getDataIndex++) {
      data.push(await elements[getDataIndex].isDisplayed(_action));
    }
    return data;
  }

  async find(
    { _visible, _where, _whereNot }: { _where?: any; _visible?: any; _whereNot?: any } = {},
    collectionItems,
  ): Promise<any[]> {
    const visibilityPart = _visible ? `\nwhere required visibilit state ${safeJSONstringify(_visible)}` : '';
    const wherePart = _where ? `\nwhere required content state ${safeJSONstringify(_where)}` : '';
    const whereNotPart = _whereNot ? `\nwhere required content state should not be ${safeJSONstringify(_where)}` : '';

    this.logger.log('PromodSystemCollection find call with data ', visibilityPart, wherePart, whereNotPart);

    const count = collectionItems.length;
    const requiredCollectionItems = [];

    const compareCallQueue = this.prepareFind({ _visible, _where, _whereNot });

    for (let index = 0; index < count; index++) {
      const collectionItem = collectionItems[index];

      if (compareCallQueue.length) {
        const isRequiredElement = await compareCallQueue.reduce((result, compareCallAction) => {
          return result.then(compareResult => {
            if (!compareResult) return compareResult;

            return (collectionItem[compareCallAction.method](compareCallAction.compareData) as Promise<boolean>)
              .then(reslt => reslt === compareCallAction.conditionBoolean)
              .catch(() => false === compareCallAction.conditionBoolean);
          });
        }, Promise.resolve(true));

        if (isRequiredElement) {
          requiredCollectionItems.push(collectionItem);
        }
        continue;
      }

      requiredCollectionItems.push(collectionItem);
    }

    if (!requiredCollectionItems.length) {
      throw new Error(
        `PromodSystemCollection ${this.identifier} with item ${this.CollectionItemClass.name} does not have required items,
				root elements count is ${count}${visibilityPart}${wherePart}${whereNotPart}`,
      );
    }

    return requiredCollectionItems;
  }

  private prepareFind({ _visible, _where, _whereNot }) {
    const callCompareQueue = [] as { compareData: any; method: string; conditionBoolean }[];

    if (isNotEmptyObject(_visible) || isBoolean(_visible)) {
      callCompareQueue.push({ compareData: _visible, method: 'compareVisibility', conditionBoolean: true });
    }
    if (isNotEmptyObject(_where) || !isUndefined(_where)) {
      callCompareQueue.push({ compareData: _where, method: 'compareContent', conditionBoolean: true });
    }
    if (isNotEmptyObject(_whereNot) || !isUndefined(_whereNot)) {
      callCompareQueue.push({ compareData: _whereNot, method: 'compareContent', conditionBoolean: false });
    }

    return callCompareQueue;
  }

  async getElements() {
    await this.waitLoadedState();

    const count = await this.rootElements[elementAction.count]();

    return await Array.from({ length: count })
      .map((_item, index) => index)
      .map(requiredIndex => this.getElement(requiredIndex));
  }

  async getInteractionElements(action) {
    const { _count, _indexes, _visible, _where, _whereNot } = action;
    const findDescription = { _visible, _where, _whereNot };

    let requiredElements;
    if (isNumber(_count)) {
      requiredElements = await Array.from({ length: _count }).map((_item, index) => this.getElement(index));
    } else if (isNumber(_indexes) || isArray(_indexes)) {
      requiredElements = await toArray(_indexes).map(index => this.getElement(index));
    } else {
      requiredElements = await this.getElements();
    }

    return this.find(findDescription, requiredElements);
  }

  getElement(index) {
    const instance = new this.CollectionItemClass(
      this.rootLocator,
      `${this.identifier} item ${index}`,
      this.rootElements[baseLibraryDescription.getBaseElementFromCollectionByIndex](index),
    );
    if (this.overrideCollectionItems.length) {
      instance.overrideBaseMethods(...this.overrideCollectionItems);
    }

    const parent = this;

    instance.setParent = parent;
    instance.setIndex = index;

    return instance;
  }

  async compareContent(compareActionData) {
    const { _where, ...rest } = compareActionData;
    return this.find({ _where: _where || rest }, await this.getElements()).then(
      res => res,
      error => {
        this.logger.log('PromodSystemCollection compareContent call with error result ', error);
        return false;
      },
    );
  }

  async compareVisibility(compareActionData) {
    const { _visible, ...rest } = compareActionData;
    return this.find({ _visible: _visible || rest }, await this.getElements()).then(
      res => res,
      error => {
        this.logger.log('PromodSystemCollection compareContent call with error result ', error);
        return false;
      },
    );
  }
}

function updateElementActionsMap(elementActionMap) {
  Object.assign(elementAction, elementActionMap);
}

function updateBaseLibraryDescription(baseLibraryDescriptionMap) {
  Object.assign(baseLibraryDescription, baseLibraryDescriptionMap);
}

export { PromodSystemCollection, updateElementActionsMap, updateBaseLibraryDescription };
