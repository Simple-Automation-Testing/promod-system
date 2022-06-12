import { PromodSystemCollection } from '../../system/base-interfaces/collection';
import { seleniumWD } from 'promod';

const { $$ } = seleniumWD;

describe('PromodSystemCollection', function () {
  class NoopChild {}

  const promodCollection = new PromodSystemCollection('test', 'Test', $$('a'), NoopChild);
});
