export type TisEq<X, Y> = X extends Y ? (Y extends X ? true : false) : false;

export type TresultBasedOnArgument<TflowcallArgument, TflowResult extends Record<string | number | symbol, unknown>> = {
  [K in keyof TflowcallArgument]: TflowResult[K];
};

export type TobjectFromStringArray<TrequiredDataFields extends readonly string[]> = {
  [K in TrequiredDataFields[number]]: string;
};

export type TChainableActions<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends (fields: infer P, ...args: infer Z) => infer R
    ? R extends Promise<any>
      ? TisEq<P, readonly any[]> extends true
        ? <T extends readonly string[] & P>(
            fields: T,
            ...args: Z
          ) => Promise<TobjectFromStringArray<T>> & TChainableActions<T>
        : (...args: Parameters<T[K]>) => ReturnType<T[K]> & TChainableActions<T>
      : (...args: Parameters<T[K]>) => ReturnType<T[K]> & TChainableActions<T>
    : (...args: Parameters<T[K]>) => ReturnType<T[K]> & TChainableActions<T>;
};
