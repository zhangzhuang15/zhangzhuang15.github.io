
declare function createFnChain<T extends AnyFunc[]>(...fn: PipeArgs<T> extends T ? T : PipeArgs<T> ): void;



type AnyFunc = (...arg: any) => any;

type PipeArgs<F extends AnyFunc[], Acc extends AnyFunc[] = [], K = any> = F extends [
    (...args: infer A) => infer B
  ]
    ? [...Acc, (...args: A) => B] 
    : F extends [(...args: infer A) => infer B, ...infer Tail]
      ? Tail extends [(arg: B) => infer C, ...any[]]
        ? PipeArgs<Tail, [...Acc, (...args: A) => B], C>
        : Acc
      : F extends [(arg: K) => any]
        ? Acc
        : never;

https://dev.to/ecyrbe/how-to-use-advanced-typescript-to-define-a-pipe-function-381h

https://www.techinterviewhandbook.org/software-engineering-interview-guide/

type M = PipeArgs<[(arg: string) => number, () => number]>