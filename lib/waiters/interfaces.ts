interface IWaitConditionOpts {
	timeout?: number;
	message?: string;
	interval?: number;
	throwCustom?: (...args: any[]) => unknown;
}

export {
	IWaitConditionOpts,
};
