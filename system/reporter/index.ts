// @ts-check

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
    startCase: async (testCaseTitle: string) => {
      for (const reporter of activeReporters) {
        await reporter.startCase(testCaseTitle);
      }
    },
    addStep: async (stepData: string, stepArguments?: any, stepResult?: any) => {
      for (const reporter of activeReporters) {
        await reporter.addStep(stepData, stepArguments, stepResult);
      }
    },
    addCustomData: async (...args: any[]) => {
      for (const reporter of activeReporters) {
        await reporter.addCustomData(...args);
      }
    },
    finishSuccessCase: async (testCaseTitle: string) => {
      for (const reporter of activeReporters) {
        await reporter.finishSuccessCase(testCaseTitle);
      }
    },
    finishFailedCase: async (testCaseTitle: string, error: Error) => {
      for (const reporter of activeReporters) {
        await reporter.finishFailedCase(testCaseTitle, error);
      }
    },
  };
})();

export { reportersManager };

export { FsReporter } from './fs';
export { ConsoleReporter } from './console';
