import type { Equal, Expect } from '@type-challenges/utils'

interface Todo {
  title: string
  completed: boolean
  description: string

  meta: {
    author: string
  }
}

// ========== 1. My Pick ==========

export type MyPick<T, K extends keyof T> = {
  [P in K]: T[P]
}

export type MyPickCases = [
  Expect<Equal<Pick<Todo, 'title'>, MyPick<Todo, 'title'>>>,
  Expect<Equal<Pick<Todo, 'title' | 'completed'>, MyPick<Todo, 'title' | 'completed'>>>,

  // @ts-expect-error: Invalid key
  MyPick<Todo, 'title' | 'completed' | 'invalid'>,
]

// ========== 2. My Readonly ==========

export type MyReadonly<T> = {
  readonly [P in keyof T]: T[P]
}

export type MyReadonlyCases = [Expect<Equal<Readonly<Todo>, MyReadonly<Todo>>>]

// ========== 3. Tuple to Enum Object ==========

export type TupleToObject<T extends readonly (number | string)[]> = {
  [P in T[number]]: P
}

export type TupleToObjectCases = [
  Expect<Equal<TupleToObject<[]>, {}>>,
  Expect<Equal<TupleToObject<[1, 'b', 'c']>, { 1: 1; b: 'b'; c: 'c' }>>,

  // @ts-expect-error: Invalid input
  TupleToObject<[[1, 2], {}, () => {}]>,
]

// ========== 4. First of Array ==========

export type First<T extends unknown[]> = T extends [infer R, ...any[]] ? R : never

export type FirstCases = [
  Expect<Equal<First<[]>, never>>,
  Expect<Equal<First<[1, 2, 3]>, 1>>,
  Expect<Equal<First<[undefined]>, undefined>>,

  // @ts-expect-error: Invalid input
  First<'notArray'>,
  // @ts-expect-error: Invalid input
  First<{ 0: 'arrayLike' }>,
]

// ========== 5. Length of Tuple ==========

export type Length<T extends unknown[]> = T extends { length: infer R } ? R : never

export type LengthCases = [
  Expect<Equal<Length<[]>, 0>>,
  Expect<Equal<Length<[1, '2', () => {}]>, 3>>,

  // @ts-expect-error: Invalid input
  Expect<Equal<Length<'string has length too'>, 3>>,
]

// ========== 6. My Exclude ==========

export type MyExclude<T, U extends T> = T extends U ? never : T

export type MyExcludeCases = [
  Expect<Equal<MyExclude<keyof Todo, 'meta'>, Exclude<keyof Todo, 'meta'>>>,
  Expect<Equal<MyExclude<keyof Todo, 'meta' | 'title'>, Exclude<keyof Todo, 'meta' | 'title'>>>,

  // @ts-expect-error: Invalid key
  MyExclude<keyof Todo, 'invalid'>,
]

// ========== 7. Awaited ==========

// // 7.1.
// export type MyAwaited<T> = T extends Promise<infer U>
//   ? (U extends Promise<unknown> ? MyAwaited<U> : U)
//   : never

// 7.2.
export type MyAwaited<T> = T extends null | undefined
  ? T
  : (T extends object & { then(onfulfilled: infer F): any }
      ? (F extends (value: infer V) => any
          ? MyAwaited<V>
          : never)
      : T)

const thenable = {
  then: (onfulfilled: (value: string | number | boolean) => void) => {
    onfulfilled(1)
  },
} as const

export type MyAwaitedCases = [
  // 7.1.
  Expect<Equal<MyAwaited<Promise<string>>, Awaited<Promise<string>>>>,
  Expect<Equal<MyAwaited<Promise<Promise<string>>>, Awaited<Promise<Promise<string>>>>>,

  // 7.2.
  Expect<Equal<MyAwaited<string>, Awaited<string>>>,
  Expect<Equal<MyAwaited<typeof thenable>, Awaited<typeof thenable>>>,
]

// ========== 8. If ==========

export type If<C extends boolean, A, B> = C extends true ? A : B

export type IfCases = [
  Expect<Equal<If<true, 1, 2>, 1>>,
  Expect<Equal<If<false, 1, 2>, 2>>,

  // @ts-expect-error: Invalid input
  If<null, 1, 2>,
]

// ========== 9. Concat ==========

export type Concat<T extends unknown[], U extends unknown[]> = [...T, ...U]

export type ConcatCases = [
  Expect<Equal<Concat<[1], [2]>, [1, 2]>>,
  Expect<Equal<Concat<[1], [boolean]>, [1, boolean]>>,
  Expect<Equal<Concat<[1], [() => {}]>, [1, () => {}]>>,
]

// ========== 10. Includes ==========

export type Includes<T extends unknown[], U> = T extends [infer First, ...infer Rest]
  ? (Equal<First, U> extends true ? true : Includes<Rest, U>)
  : false

export type IncludesCases = [
  Expect<Equal<Includes<[1, 2, 3], 1>, true>>,
  Expect<Equal<Includes<[1, 2, 3], 3>, true>>,
  Expect<Equal<Includes<[1, 2, 3], 4>, false>>,
  Expect<Equal<Includes<[1 | 2], 1 | 2>, true>>,
  Expect<Equal<Includes<[1 | 2], 1>, false>>,
  Expect<Equal<Includes<[1], 1 | 2>, false>>,
  Expect<Equal<Includes<[false], false>, true>>,
  Expect<Equal<Includes<[boolean], false>, false>>,
  Expect<Equal<Includes<[{ a: 1 }], { a: 1 }>, true>>,
  Expect<Equal<Includes<[{ readonly a: 1 }], { a: 1 }>, false>>,
]

// ========== 11. Push ==========

export type Push<T extends unknown[], U> = [...T, U]

export type PushCases = [
  Expect<Equal<Push<[], 1>, [1]>>,
  Expect<Equal<Push<[1, 2], 3>, [1, 2, 3]>>,
]

// ========== 12. Unshift ==========

export type UnShift<T extends unknown[], U> = [U, ...T]

export type UnShiftCases = [
  Expect<Equal<UnShift<[], 1>, [1]>>,
  Expect<Equal<UnShift<[1, 2], 3>, [3, 1, 2]>>,
]

// ========== 13. Parameters ==========

export type Parameters<T extends Function> = T extends (...args: infer R) => unknown ? R : never

export type ParametersCases = [
  Expect<Equal<Parameters<() => void>, []>>,
  Expect<Equal<Parameters<(a: string) => void>, [string]>>,
  Expect<Equal<Parameters<(a: string, b: number) => void>, [string, number]>>,
  Expect<Equal<Parameters<(a: { a: 'a' }) => void>, [{ a: 'a' }]>>,
]
