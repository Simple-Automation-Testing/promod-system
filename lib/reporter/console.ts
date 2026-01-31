// @ts-check
import { colors, safeJSONstringify, isNotEmptyObject, stringifyData } from 'sat-utils';

/**
 * Logger interface for dependency injection.
 * Allows replacing console.log with a mock during testing.
 */
interface Logger {
  log: (...args: any[]) => void;
}

/** Default logger using console.log */
const defaultLogger: Logger = {
  log: (...args: any[]) => {
    try {
      // eslint-disable-next-line no-console
      console.log(...args);
    } catch {
      /* swallow errors during logging */
    }
  },
};

/**
 * Configuration options for ConsoleReporter
 */
interface ConsoleReporterOptions {
  isEnabled?: boolean;
  logger?: Logger;
}

class ConsoleReporter {
  private isEnabled: boolean;
  private logger: Logger;

  constructor(options?: boolean | ConsoleReporterOptions) {
    // Support both old API (boolean) and new API (options object)
    if (typeof options === 'boolean') {
      this.isEnabled = options;
      this.logger = defaultLogger;
    } else {
      this.isEnabled = options?.isEnabled ?? false;
      this.logger = options?.logger ?? defaultLogger;
    }
  }

  inSuite(suiteTitle: string) {
    if (this.isEnabled) {
      this.logger.log(colors.blue('START SUITE: '), suiteTitle);
    }
  }

  addCaseProperties(opts) {
    if (this.isEnabled && isNotEmptyObject(opts)) {
      this.logger.log(`${colors.blue('CASE PROPERTIES:')}
${safeJSONstringify(opts)}
______________________________________________________`);
    }
  }

  startCase(testCaseTitle: string) {
    if (this.isEnabled) {
      this.logger.log(colors.blue('START CASE: '), testCaseTitle);
    }
  }

  addStep(stepData: string) {
    if (this.isEnabled) {
      this.logger.log(colors.yellow('STEP START: '), stepData);
    }
    return this.finishStep.bind(this);
  }

  finishStep(message: string, result: unknown, error: Error | null) {
    if (this.isEnabled) {
      this.logger.log(colors.yellow('FINISH STEP: '), message, stringifyData(result), error);
    }
  }

  addCustomData(...args: any[]) {
    if (this.isEnabled) {
      this.logger.log(colors.yellow('DATA: '), ...args);
    }
  }

  finishSuccessCase(testCaseTitle: string) {
    if (this.isEnabled) {
      this.logger.log(colors.green('FINISH TEST CASE: '), testCaseTitle);
    }
  }

  finishFailedCase(testCaseTitle: string, error: Error) {
    if (this.isEnabled) {
      this.logger.log(colors.green('FINISH TEST CASE WITH ERRORS: '), testCaseTitle, '\n', error);
    }
  }
}

export { ConsoleReporter, Logger, ConsoleReporterOptions };
