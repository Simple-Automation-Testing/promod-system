interface IWaitConditionOpts {
  timeout?: number;
  interval?: number;
  dontThrow?: boolean;
  message?: string | ((timeout: number, callbackError?: any) => Promise<string> | string);
  waiterError?: new (...args: any[]) => any;
}

export { IWaitConditionOpts };
