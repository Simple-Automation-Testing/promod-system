import { strictEqual, deepStrictEqual } from 'node:assert';
import { ConsoleReporter, Logger } from '../../lib/reporter/console';

/**
 * Creates a mock logger that captures all log calls for testing.
 */
function createMockLogger(): Logger & { calls: any[][] } {
  const calls: any[][] = [];
  return {
    calls,
    log: (...args: any[]) => {
      calls.push(args);
    },
  };
}

describe('ConsoleReporter', function () {
  describe('constructor', function () {
    it('should accept boolean for backward compatibility', function () {
      const mockLogger = createMockLogger();
      const reporter = new ConsoleReporter({ isEnabled: true, logger: mockLogger });
      reporter.startCase('test');
      strictEqual(mockLogger.calls.length, 1);
    });

    it('should default to disabled when no options provided', function () {
      const mockLogger = createMockLogger();
      const reporter = new ConsoleReporter({ logger: mockLogger });
      reporter.startCase('test');
      strictEqual(mockLogger.calls.length, 0);
    });

    it('should support old boolean API (true)', function () {
      // When using boolean API, it uses defaultLogger which we can't mock easily
      // Just verify it doesn't throw
      const reporter = new ConsoleReporter(true);
      strictEqual(reporter instanceof ConsoleReporter, true);
    });

    it('should support old boolean API (false)', function () {
      const reporter = new ConsoleReporter(false);
      strictEqual(reporter instanceof ConsoleReporter, true);
    });
  });

  describe('when disabled', function () {
    let reporter: ConsoleReporter;
    let mockLogger: ReturnType<typeof createMockLogger>;

    beforeEach(function () {
      mockLogger = createMockLogger();
      reporter = new ConsoleReporter({ isEnabled: false, logger: mockLogger });
    });

    it('inSuite should not log', function () {
      reporter.inSuite('Test Suite');
      strictEqual(mockLogger.calls.length, 0);
    });

    it('addCaseProperties should not log', function () {
      reporter.addCaseProperties({ key: 'value' });
      strictEqual(mockLogger.calls.length, 0);
    });

    it('startCase should not log', function () {
      reporter.startCase('Test Case');
      strictEqual(mockLogger.calls.length, 0);
    });

    it('addStep should not log but should return finishStep function', function () {
      const finishStep = reporter.addStep('Step 1');
      strictEqual(mockLogger.calls.length, 0);
      strictEqual(typeof finishStep, 'function');
    });

    it('finishStep should not log', function () {
      reporter.finishStep('Step done', { result: 'ok' }, null);
      strictEqual(mockLogger.calls.length, 0);
    });

    it('addCustomData should not log', function () {
      reporter.addCustomData('custom', 'data');
      strictEqual(mockLogger.calls.length, 0);
    });

    it('finishSuccessCase should not log', function () {
      reporter.finishSuccessCase('Test Case');
      strictEqual(mockLogger.calls.length, 0);
    });

    it('finishFailedCase should not log', function () {
      reporter.finishFailedCase('Test Case', new Error('Test error'));
      strictEqual(mockLogger.calls.length, 0);
    });
  });

  describe('when enabled', function () {
    let reporter: ConsoleReporter;
    let mockLogger: ReturnType<typeof createMockLogger>;

    beforeEach(function () {
      mockLogger = createMockLogger();
      reporter = new ConsoleReporter({ isEnabled: true, logger: mockLogger });
    });

    describe('inSuite', function () {
      it('should log suite title with blue color prefix', function () {
        reporter.inSuite('My Test Suite');
        strictEqual(mockLogger.calls.length, 1);
        strictEqual(mockLogger.calls[0].length, 2);
        strictEqual(mockLogger.calls[0][1], 'My Test Suite');
        // First arg contains colored "START SUITE: "
        strictEqual(mockLogger.calls[0][0].includes('START SUITE:'), true);
      });
    });

    describe('addCaseProperties', function () {
      it('should log properties when opts is not empty', function () {
        reporter.addCaseProperties({ browser: 'chrome', timeout: 5000 });
        strictEqual(mockLogger.calls.length, 1);
        strictEqual(mockLogger.calls[0][0].includes('CASE PROPERTIES:'), true);
        strictEqual(mockLogger.calls[0][0].includes('browser'), true);
      });

      it('should not log when opts is empty object', function () {
        reporter.addCaseProperties({});
        strictEqual(mockLogger.calls.length, 0);
      });

      it('should not log when opts is null', function () {
        reporter.addCaseProperties(null);
        strictEqual(mockLogger.calls.length, 0);
      });

      it('should not log when opts is undefined', function () {
        reporter.addCaseProperties(undefined);
        strictEqual(mockLogger.calls.length, 0);
      });
    });

    describe('startCase', function () {
      it('should log test case title with blue color prefix', function () {
        reporter.startCase('My Test Case');
        strictEqual(mockLogger.calls.length, 1);
        strictEqual(mockLogger.calls[0][1], 'My Test Case');
        strictEqual(mockLogger.calls[0][0].includes('START CASE:'), true);
      });
    });

    describe('addStep', function () {
      it('should log step data with yellow color prefix', function () {
        reporter.addStep('Click on button');
        strictEqual(mockLogger.calls.length, 1);
        strictEqual(mockLogger.calls[0][1], 'Click on button');
        strictEqual(mockLogger.calls[0][0].includes('STEP START:'), true);
      });

      it('should return bound finishStep function', function () {
        const finishStep = reporter.addStep('Step 1');
        strictEqual(typeof finishStep, 'function');

        // Call the returned function
        finishStep('Step completed', { success: true }, null);
        strictEqual(mockLogger.calls.length, 2); // addStep + finishStep
        strictEqual(mockLogger.calls[1][0].includes('FINISH STEP:'), true);
      });
    });

    describe('finishStep', function () {
      it('should log step completion with message, result, and error', function () {
        reporter.finishStep('Step done', { value: 42 }, null);
        strictEqual(mockLogger.calls.length, 1);
        strictEqual(mockLogger.calls[0][0].includes('FINISH STEP:'), true);
        strictEqual(mockLogger.calls[0][1], 'Step done');
        // result is stringified
        strictEqual(mockLogger.calls[0][3], null);
      });

      it('should log step completion with error', function () {
        const error = new Error('Something went wrong');
        reporter.finishStep('Step failed', null, error);
        strictEqual(mockLogger.calls.length, 1);
        strictEqual(mockLogger.calls[0][3], error);
      });
    });

    describe('addCustomData', function () {
      it('should log custom data with yellow color prefix', function () {
        reporter.addCustomData('key1', 'value1', { nested: true });
        strictEqual(mockLogger.calls.length, 1);
        strictEqual(mockLogger.calls[0][0].includes('DATA:'), true);
        strictEqual(mockLogger.calls[0][1], 'key1');
        strictEqual(mockLogger.calls[0][2], 'value1');
        deepStrictEqual(mockLogger.calls[0][3], { nested: true });
      });

      it('should handle no arguments', function () {
        reporter.addCustomData();
        strictEqual(mockLogger.calls.length, 1);
        strictEqual(mockLogger.calls[0].length, 1); // Only the prefix
      });
    });

    describe('finishSuccessCase', function () {
      it('should log successful test case with green color prefix', function () {
        reporter.finishSuccessCase('My Test Case');
        strictEqual(mockLogger.calls.length, 1);
        strictEqual(mockLogger.calls[0][1], 'My Test Case');
        strictEqual(mockLogger.calls[0][0].includes('FINISH TEST CASE:'), true);
      });
    });

    describe('finishFailedCase', function () {
      it('should log failed test case with error', function () {
        const error = new Error('Assertion failed');
        reporter.finishFailedCase('My Test Case', error);
        strictEqual(mockLogger.calls.length, 1);
        strictEqual(mockLogger.calls[0][0].includes('FINISH TEST CASE WITH ERRORS:'), true);
        strictEqual(mockLogger.calls[0][1], 'My Test Case');
        strictEqual(mockLogger.calls[0][2], '\n');
        strictEqual(mockLogger.calls[0][3], error);
      });
    });
  });

  describe('integration', function () {
    it('should support full test lifecycle', function () {
      const mockLogger = createMockLogger();
      const reporter = new ConsoleReporter({ isEnabled: true, logger: mockLogger });

      reporter.inSuite('Integration Suite');
      reporter.addCaseProperties({ retries: 3 });
      reporter.startCase('Integration Test');

      const finishStep1 = reporter.addStep('Step 1: Setup');
      finishStep1('Setup complete', { initialized: true }, null);

      const finishStep2 = reporter.addStep('Step 2: Action');
      finishStep2('Action complete', { clicked: true }, null);

      reporter.addCustomData('screenshot', '/path/to/screenshot.png');
      reporter.finishSuccessCase('Integration Test');

      // Verify all calls were made:
      // inSuite + addCaseProperties + startCase + addStep + finishStep + addStep + finishStep + addCustomData + finishSuccessCase = 9
      strictEqual(mockLogger.calls.length, 9);
    });

    it('should support failed test lifecycle', function () {
      const mockLogger = createMockLogger();
      const reporter = new ConsoleReporter({ isEnabled: true, logger: mockLogger });

      reporter.startCase('Failing Test');
      const finishStep = reporter.addStep('Step that fails');
      const error = new Error('Element not found');
      finishStep('Step failed', null, error);
      reporter.finishFailedCase('Failing Test', error);

      strictEqual(mockLogger.calls.length, 4);
    });
  });
});
