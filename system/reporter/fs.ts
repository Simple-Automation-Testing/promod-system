// @ts-check
import { writeFileSync } from 'fs';
import { resolve } from 'path';

class FsReporter {
  private outputPath: string;
  private isEnabled: boolean;
  private data: any[];
  private caseTitle;
  private suiteTitle;

  constructor(outputPath?: string, isEnabled?: boolean) {
    this.outputPath = outputPath;
    this.isEnabled = isEnabled;
    this.data = [];
  }

  inSuite(suiteTitle: string) {
    if (this.isEnabled) {
      this.suiteTitle = suiteTitle;
    }
  }

  startCase(testCaseTitle: string) {
    if (this.isEnabled) {
      this.caseTitle = testCaseTitle;

      this.data.push(this.caseTitle);
    }
  }

  addStep(stepData: string) {
    if (this.isEnabled) {
      this.data.push(stepData);
    }
  }

  addCustomData(...args: any[]) {
    if (this.isEnabled) {
      this.data.push(...args);
    }
  }

  finishSuccessCase(testCaseTitle: string) {
    if (this.isEnabled) {
      writeFileSync(resolve(`${this.outputPath}`, `./${testCaseTitle}.log`), this.data.join('\n'), {
        encoding: 'utf8',
      });
    }
  }

  finishFailedCase(testCaseTitle: string, error: Error) {
    if (this.isEnabled) {
      this.data.push(error.toString());
      writeFileSync(resolve(`${this.outputPath}`, `./FAILED: ${testCaseTitle}.log`), this.data.join('\n'), {
        encoding: 'utf8',
      });
    }
  }
}

export { FsReporter };
