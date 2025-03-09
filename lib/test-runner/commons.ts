export type TtestOpts = {
  [k: string]: string | string[] | number | number[] | unknown;
};

export type TreporterInstance<Topts = TtestOpts> = {
  startCase?: (testCaseTitle: string) => void | Promise<void>;

  logTestBody?: (testBody: string | ((...args: any[]) => any | Promise<any>)) => void | Promise<void>;

  addCaseProperties?: (opts: Topts) => void | Promise<void>;
  addStep?: (stepData: string, stepArguments?: any, stepResult?: any) => void | Promise<void>;
  finishStep?: (...args) => void | Promise<void>;

  addCustomData?: (...args) => void | Promise<void>;
  log?: (...args) => void | Promise<void>;

  finishSuccessCase?: (testCaseTitle: string) => void | Promise<void>;
  finishFailedCase?: (testCaseTitle: string, error: Error) => void | Promise<void>;
};

export type TtestBody<Tfixtures> = (fixtures: Tfixtures) => Promise<void> | any;
export type TcheckTestCondition<Topts = TtestOpts> = (testName: string, opts?: Topts) => boolean;
export type TdescribeBody<Tfixtures> = (fixtures: Tfixtures) => void;
