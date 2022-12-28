// @ts-check
import { safeHasOwnPropery } from 'sat-utils';

export type TreporterInstance = {
  startCase: (testCaseTitle: string) => void;

  addStep: (stepData: string, stepArguments?: any, stepResult?: any) => void;
  addCustomData?: (...args) => void;

  finishSuccessCase: (testCaseTitle: string) => void;
  finishFailedCase: (testCaseTitle: string, error: Error) => void;
};

const reportersManager = (() => {
  const activeReporters: TreporterInstance[] = [];

  return {
    addReporter: (reporter: TreporterInstance) => {
      activeReporters.push(reporter);
    },
    reset: () => {
      activeReporters.splice(0, activeReporters.length);
    },
    startCase: (testCaseTitle: string) => {
      activeReporters.forEach(reporter => {
        if (safeHasOwnPropery(reporter, 'startCase')) {
          reporter.startCase(testCaseTitle);
        }
      });
    },
    addStep: (stepData: string, stepArguments?: any, stepResult?: any) => {
      activeReporters.forEach(reporter => {
        if (safeHasOwnPropery(reporter, 'addStep')) {
          reporter.addStep(stepData, stepArguments, stepResult);
        }
      });
    },
    addCustomData: (...args: any[]) => {
      activeReporters.forEach(reporter => {
        if (safeHasOwnPropery(reporter, 'addCustomData')) {
          // @ts-ignore
          reporter.addCustomData(...args);
        }
      });
    },
    finishSuccessCase: (testCaseTitle: string) => {
      activeReporters.forEach(reporter => {
        if (safeHasOwnPropery(reporter, 'finishSuccessCase')) {
          reporter.finishSuccessCase(testCaseTitle);
        }
      });
    },
    finishFailedCase: (testCaseTitle: string, error: Error) => {
      activeReporters.forEach(reporter => {
        if (safeHasOwnPropery(reporter, 'finishFailedCase')) {
          reporter.finishFailedCase(testCaseTitle, error);
        }
      });
    },
  };
})();

export { reportersManager };
