import { ElementTest } from './_misc.element';
import { StructureAsFragment, StructureAsPage } from './_misc.structure';
import { PromodSystemCollection } from '../../system/base-interfaces/collection';

class TestUserFormFragment extends StructureAsFragment {
  private username: ElementTest;
  private password: ElementTest;
  private submit: ElementTest;

  constructor(locator, structureName, rootElement) {
    super(locator, structureName, rootElement);

    this.username = this.init('#username', 'Username', ElementTest);
    this.password = this.init('#password', 'Password', ElementTest);
    this.submit = this.init('#user_submit', 'Submit', ElementTest);
  }
}

class TestPage extends StructureAsPage {
  private userform: TestUserFormFragment;
  private userdata: ElementTest;

  constructor() {
    super('body', 'Test Page');

    this.userform = this.init('#section1_internal3', 'User form', TestUserFormFragment);
    this.userdata = this.init('#userdata', 'User data', ElementTest);
  }
}

class CollectionItemFragment extends StructureAsFragment {
  private field1: ElementTest;
  private field2: ElementTest;
  private field3: ElementTest;

  constructor(locator, structureName, rootElement) {
    super(locator, structureName, rootElement);

    this.field1 = this.init('div:nth-child(1)', 'Field1', ElementTest);
    this.field2 = this.init('div:nth-child(2)', 'Field2', ElementTest);
    this.field3 = this.init('div:nth-child(3)', 'Field2', ElementTest);
  }
}

class TestComplexPage extends StructureAsPage {
  private userform: TestUserFormFragment;
  private userdata: ElementTest;
  private collection: PromodSystemCollection;

  constructor() {
    super('body', 'Test Complex Page');

    this.userform = this.init('#section1_internal3', 'User form', TestUserFormFragment);
    this.userdata = this.init('#userdata', 'User data', ElementTest);
    this.collection = this.initCollection(
      '.collection_item',
      'Collection item',
      PromodSystemCollection,
      CollectionItemFragment,
    );
  }
}

export { TestPage, TestComplexPage };
