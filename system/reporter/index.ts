// @ts-check
const { warn } = console;

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
        try {
          await reporter.startCase(testCaseTitle);
        } catch (error) {
          warn(error);
        }
      }
    },
    addStep: async (stepData: string, stepArguments?: any, stepResult?: any) => {
      for (const reporter of activeReporters) {
        try {
          await reporter.addStep(stepData, stepArguments, stepResult);
        } catch (error) {
          warn(error);
        }
      }
    },
    addCustomData: async (...args: any[]) => {
      for (const reporter of activeReporters) {
        try {
          await reporter.addCustomData(...args);
        } catch (error) {
          warn(error);
        }
      }
    },
    finishSuccessCase: async (testCaseTitle: string) => {
      for (const reporter of activeReporters) {
        try {
          await reporter.finishSuccessCase(testCaseTitle);
        } catch (error) {
          warn(error);
        }
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
