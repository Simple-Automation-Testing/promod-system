import { getMochaPreparedRunner } from '../../lib/test-runner/mocha';

const fixtures = {
  a: 1,
};

type TOpts = {
  tags: string[];
};
const { beforeAll, ...r } = getMochaPreparedRunner<typeof fixtures, TOpts>(fixtures);

const { test, suite } = r;

suite('example sync', function () {
  test('first call', async f => {
    f?.afterTest(async () => {
      throw new Error('This is a debug test');
    });
  });

  test('second call', f => {
    f?.afterTest(() => console.log('!!!!!!! 2'));
  });
});
