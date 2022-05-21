interface IWaitConditionOpts {
  timeout?: number;
  interval?: number;
  dontThrow?: boolean;
  message?: string;
  throwCustom?: () => any;
  createMessage?: (...args: any[]) => string;
  waiterError?: new (...args: any[]) => any;
}

export { IWaitConditionOpts };
