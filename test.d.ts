declare function createFnChain<T extends AnyFunc[]>(...fn: PipeArgs2<T> extends T ? T : PipeArgs2<T> ): LastFunctionReturnType<T>;

type LastFunctionReturnType<T extends AnyFunc[]> = 
  T extends [...infer N extends AnyFunc[], (arg: infer A) => infer B] 
    ? B extends Promise<any>
      ? B 
      : LastFunctionReturnType<N> extends Promise<any>
        ? Promise<B>
        : B
    : T extends [(...args: infer A) => infer B]
      ? B 
      : T extends [(arg: infer A) => infer B] 
        ? B
        : never;

type AnyFunc = (...arg: any) => any;

type PipeArgs<F extends AnyFunc[], Acc extends AnyFunc[] = []> = F extends [
    (...args: infer A) => infer B
  ]
    ? [...Acc, (...args: A) => B] 
    : F extends [(arg: infer A) => infer B] 
      ? [...Acc, (arg: A) => B]
      : F extends [(...args: infer A) => infer B, ...infer Tail]
        ? Tail extends [(arg: B) => infer C, ...any[]]
          ? PipeArgs<Tail, [(...args: A) => B, ...Acc]>
          : Acc
        : Acc;

type M = PipeArgs<[(arg: string) => number, () => string]>


type PipeArgs2<F extends AnyFunc[], Acc extends AnyFunc[] = []> = 
  F extends [(...args: infer A) => infer B]
    ? Acc extends []
      ? [(...args: A) => B]
      : [...Acc, (arg: A[0]) => B]
    : F extends [(...args: infer A) => infer B, ...infer Tail]
      ? Tail extends [(arg: infer C) => any, ...any[]]
        ? B extends Promise<infer D>
          ? C extends D 
            ? D extends C 
              ? PipeArgs2<Tail, [(...args: A) => B, ...Acc]>
              : PipeArgs2<[(...args: A) => B], Acc>
            : PipeArgs2<[(...args: A) => B], Acc>
          : C extends B 
            ? B extends C 
              ? PipeArgs2<Tail, [(...args: A) => B, ...Acc]>
              : PipeArgs2<[(...args: A) => B], Acc>
            : PipeArgs2<[(...args: A) => B], Acc>
        : PipeArgs2<[(...args: A) => B], Acc>
      : Acc;



type S = PipeArgs2<[(arg: string) => number, (arg: number) => Promise<string>]>
type NNN = [() => string] extends [(args: string) => infer B, ...infer Tail] ? B : never;