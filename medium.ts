import type { Alike, Equal, Expect } from '@type-challenges/utils'
// import type { MyExclude } from './easy'

interface Todo {
  readonly id: number
  title: string
  completed: boolean
  description: string

  meta: {
    author: string
  }
}

// ========== 1. Get Return Type ==========

export type MyReturnType<T extends (...args: unknown[]) => unknown> = T extends (...args: unknown[]) => infer R ? R : never

export type MyReturnTypeCase = [
  Expect<Equal<MyReturnType<() => 123>, 123>>,
  Expect<Equal<MyReturnType<() => 1 | 2>, 1 | 2>>,
  Expect<Equal<MyReturnType<() => string>, string>>,
  Expect<Equal<MyReturnType<() => Promise<boolean>>, Promise<boolean>>>,
  Expect<Equal<MyReturnType<() => Todo>, Todo>>,
]

// ========== 2. My Omit ==========

export type MyOmit<T, K extends keyof T> = {
  // [P in MyExclude<keyof T, K>]: T[P]

  [P in keyof T as Exclude<P, K>]: T[P]
  //            ^^^^^^^^^^^^^^^^^
  // https://github.com/type-challenges/type-challenges/issues/4#issuecomment-1073171978
}

export type MyOmitCase = [
  Expect<Equal<MyOmit<Todo, 'title'>, Omit<Todo, 'title'>>>,
  Expect<Equal<MyOmit<Todo, 'title' | 'completed'>, Omit<Todo, 'title' | 'completed'>>>,

  // @ts-expect-error: Invalid key
  MyOmit<Todo, 'invalid'>,
]

// ========== 3. Custom Readonly ==========

export type CustomReadonly<T, K extends keyof T = keyof T> = {
  readonly [k in K]: T[k]
} & Omit<T, K>

export type MyCustomReadonlyCase = [
  Expect<Alike<CustomReadonly<Todo>, Readonly<Todo>>>,
  Expect<Alike<CustomReadonly<{ a: number; b: string }, 'a'>, { readonly a: number; b: string }>>,
  Expect<Alike<CustomReadonly<{ readonly a: number; b: string }, 'b'>, { readonly a: number; readonly b: string }>>,
]

// ========== 4. Deep Readonly ==========

// DeepReadonly in Vue@3
// https://github.com/vuejs/core/blob/9617dd4b2abc07a5dc40de6e5b759e851b4d0da1/packages/reactivity/src/reactive.ts#L125-L147

export type DeepReadonly<T> = keyof T extends never
  ? T
  : { readonly [k in keyof T]: DeepReadonly<T[k]> }

export type DeepreadonlyCase = [
  Expect<Equal<DeepReadonly<{ a: number }>, { readonly a: number }>>,
  Expect<Equal<DeepReadonly<{ a: { a1: string } }>, { readonly a: { readonly a1: string } }>>,
  Expect<Equal<DeepReadonly<{ a: number[] }>, { readonly a: readonly number[] }>>,
  Expect<Equal<DeepReadonly<number>, number>>,
]

// ========== 5. Tuple to Union ==========

export type TupleToUnion<T extends readonly unknown[]> = T[number]

// https://github.com/type-challenges/type-challenges/issues/7#issuecomment-781402673
const tuple1 = [1, '2', true] as const

export type TupleToUnionCase = [
  Expect<Equal<TupleToUnion<[]>, never>>,
  Expect<Equal<TupleToUnion<[1, '2', 3]>, 1 | '2' | 3>>,
  Expect<Equal<TupleToUnion<typeof tuple1>, 1 | '2' | true>>,
]

// ========== 6. Chainable  ==========

export interface Chainable<T extends Record<string, unknown> = {}> {
  option<K extends string, V = T[string]>(
    key: K extends keyof T
      ? V extends T[K] ? never : K
      : K,
    value: V
  ): Chainable<Omit<T, K> & { [k in K]: V }>
  get(): T
}

declare const chainable: Chainable

const chainableTest1 = chainable
  .option('foo', 123)
  .option('bar', { value: 'Hello World' })
  .option('name', 'lee')
  .get()

interface ChainableTest1 {
  foo: number
  bar: { value: string }
  name: string
}

chainable
  .option('foo', 123)
  .option('bar', { value: 'Hello World' })
  // !!!
  // https://github.com/type-challenges/type-challenges/issues/598#issue-777789160
  // @ts-expect-error: Duplicate assignments are not allowed
  .option('bar', { value: 'Hello World' })
  // Override is allowed
  .option('bar', 123)
  // @ts-expect-error: Duplicate assignments are not allowed
  .option('bar', 1)

  .option('name', 'lee')
  .get()

export type ChainableCase = [
  Expect<Alike<typeof chainableTest1, ChainableTest1>>,
]

// ========== 7. Last of Array ==========

// export type Last<T extends unknown[]> = [never, ...T][T['length']]
export type Last<T extends unknown[]> = T extends [...unknown[], infer Tail] ? Tail : never

export type LastCase = [
  Expect<Equal<Last<[]>, never>>,
  Expect<Equal<Last<[1, 2, 3]>, 3>>,
]

// ========== 8. Pop ==========
// ========== 8.1. Push ==========
// ========== 8.2. Shift ==========
// ========== 8.3. Unshift ==========

export type Pop<T extends unknown[]> = T extends [...infer Head, unknown] ? Head : never

export type PopCase = [
  Expect<Equal<Pop<[1, 2, 3, 4]>, [1, 2, 3]>>,
]

// ========== 9. Promise.all ==========

export declare function PromiseAll<T extends readonly unknown[]>(values: readonly [...T]): Promise<{
  [K in keyof T]: T[K] extends Promise<infer R> ? R : T[K]
}>

const promiseAllTest1 = PromiseAll([1, 2, 3] as const)
const promiseAllTest2 = PromiseAll([1, 2, Promise.resolve(3)] as const)
const promiseAllTest3 = PromiseAll([1, 2, Promise.resolve(3)])

export type PromiseAllCase = [
  Expect<Equal<typeof promiseAllTest1, Promise<[1, 2, 3]>>>,
  Expect<Equal<typeof promiseAllTest2, Promise<[1, 2, number]>>>,
  Expect<Equal<typeof promiseAllTest3, Promise<[number, number, number]>>>,
]

// ========== 10. Type LookUp  ==========

export type LookUp<U, T> = U extends { type: T } ? U : never
// const lookUpByType = (animals: Animal[]: type: 'cat' | 'dog'): Cat | Dog => {}

interface Cat {
  type: 'cat'
  breeds: 'Abyssinian' | 'Shorthair' | 'Curl' | 'Bengal'
}

interface Dog {
  type: 'dog'
  breeds: 'Hound' | 'Brittany' | 'Bulldog' | 'Boxer'
}

type Animal = Cat | Dog

export type LookUpCase = [
  Expect<Equal<LookUp<Animal, 'dog'>, Dog>>,
  Expect<Equal<LookUp<Animal, 'cat'>, Cat>>,
]

// ========== 11. Trim Left ==========

export type Space = ' ' | '\n' | '\t'

export type TrimLeft<S extends string> = S extends `${Space}${infer F}` ? TrimLeft<F> : S

export type TrimLeftCase = [
  Expect<Equal<TrimLeft<'str'>, 'str'>>,
  Expect<Equal<TrimLeft<' str'>, 'str'>>,
  Expect<Equal<TrimLeft<' str '>, 'str '>>,
  Expect<Equal<TrimLeft<'  str '>, 'str '>>,
]

// ========== 12 Trim Right ==========

export type TrimRight<S extends string> = S extends `${infer F}${Space}` ? TrimRight<F> : S

export type TrimRightCase = [
  Expect<Equal<TrimRight<'str'>, 'str'>>,
  Expect<Equal<TrimRight<'str '>, 'str'>>,
  Expect<Equal<TrimRight<' str '>, ' str'>>,
  Expect<Equal<TrimRight<' st r  '>, ' st r'>>,
]

// ========== 13. Trim ==========

export type Trim<S extends string> = TrimLeft<TrimRight<S>>

export type TrimCases = [
  Expect<Equal<Trim<'str'>, 'str'>>,
  Expect<Equal<Trim<' str'>, 'str'>>,
  Expect<Equal<Trim<'     str'>, 'str'>>,
  Expect<Equal<Trim<'str   '>, 'str'>>,
  Expect<Equal<Trim<'     str     '>, 'str'>>,
  Expect<Equal<Trim<'   \n\t foo bar \t'>, 'foo bar'>>,
  Expect<Equal<Trim<''>, ''>>,
  Expect<Equal<Trim<' \n\t '>, ''>>,
]

// ========== 14. Capitalize ==========

export type MyCapitalize<S extends string> = S extends `${infer H}${infer E}` ? `${Uppercase<H>}${E}` : S

export type MyCapitalizeCase = [
  Expect<Equal<MyCapitalize<''>, ''>>,
  Expect<Equal<MyCapitalize<'foobar'>, 'Foobar'>>,
  Expect<Equal<MyCapitalize<'FOOBAR'>, 'FOOBAR'>>,
  Expect<Equal<MyCapitalize<'foo bar'>, 'Foo bar'>>,
  Expect<Equal<MyCapitalize<''>, ''>>,
  Expect<Equal<MyCapitalize<'a'>, 'A'>>,
  Expect<Equal<MyCapitalize<'b'>, 'B'>>,
  Expect<Equal<MyCapitalize<'c'>, 'C'>>,
  Expect<Equal<MyCapitalize<'d'>, 'D'>>,
  Expect<Equal<MyCapitalize<'e'>, 'E'>>,
  Expect<Equal<MyCapitalize<'f'>, 'F'>>,
  Expect<Equal<MyCapitalize<'g'>, 'G'>>,
  Expect<Equal<MyCapitalize<'h'>, 'H'>>,
  Expect<Equal<MyCapitalize<'i'>, 'I'>>,
  Expect<Equal<MyCapitalize<'j'>, 'J'>>,
  Expect<Equal<MyCapitalize<'k'>, 'K'>>,
  Expect<Equal<MyCapitalize<'l'>, 'L'>>,
  Expect<Equal<MyCapitalize<'m'>, 'M'>>,
  Expect<Equal<MyCapitalize<'n'>, 'N'>>,
  Expect<Equal<MyCapitalize<'o'>, 'O'>>,
  Expect<Equal<MyCapitalize<'p'>, 'P'>>,
  Expect<Equal<MyCapitalize<'q'>, 'Q'>>,
  Expect<Equal<MyCapitalize<'r'>, 'R'>>,
  Expect<Equal<MyCapitalize<'s'>, 'S'>>,
  Expect<Equal<MyCapitalize<'t'>, 'T'>>,
  Expect<Equal<MyCapitalize<'u'>, 'U'>>,
  Expect<Equal<MyCapitalize<'v'>, 'V'>>,
  Expect<Equal<MyCapitalize<'w'>, 'W'>>,
  Expect<Equal<MyCapitalize<'x'>, 'X'>>,
  Expect<Equal<MyCapitalize<'y'>, 'Y'>>,
  Expect<Equal<MyCapitalize<'z'>, 'Z'>>,
]
