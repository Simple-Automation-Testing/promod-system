// @ts-check
import { colors } from 'sat-utils';

const { log } = console;

class ConsoleReporter {
  private isEnabled: boolean;

  constructor(isEnabled?: boolean) {
    this.isEnabled = isEnabled;
  }

  inSuite(suiteTitle: string) {
    if (this.isEnabled) {
      log(colors.blue('START SUITE: '), suiteTitle);
    }
  }

  startCase(testCaseTitle: string) {
    if (this.isEnabled) {
      log(colors.blue('START CASE: '), testCaseTitle);
    }
  }

  addStep(stepData: string) {
    if (this.isEnabled) {
      log(colors.yellow('STEP: '), stepData);
    }
  }

  addCustomData(...args: any[]) {
    if (this.isEnabled) {
      log(colors.yellow('DATA: '), ...args);
    }
  }

  finishSuccessCase(testCaseTitle: string) {
    if (this.isEnabled) {
      log(colors.green('FINISH TEST CASE: '), testCaseTitle);
    }
  }

  finishFailedCase(testCaseTitle: string, error: Error) {
    if (this.isEnabled) {
      log(colors.green('FINISH TEST CASE WITH ERRORS: '), testCaseTitle, '\n', error);
    }
  }
}

export { ConsoleReporter };
