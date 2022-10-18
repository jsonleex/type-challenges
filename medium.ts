import type { Alike, Equal, Expect, MergeInsertions } from '@type-challenges/utils'
import type { Length } from './easy'
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

export type MyReturnTypeCases = [
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

export type MyOmitCases = [
  Expect<Equal<MyOmit<Todo, 'title'>, Omit<Todo, 'title'>>>,
  Expect<Equal<MyOmit<Todo, 'title' | 'completed'>, Omit<Todo, 'title' | 'completed'>>>,

  // @ts-expect-error: Invalid key
  MyOmit<Todo, 'invalid'>,
]

// ========== 3. Custom Readonly ==========

export type CustomReadonly<T, K extends keyof T = keyof T> = {
  readonly [k in K]: T[k]
} & Omit<T, K>

export type MyCustomReadonlyCases = [
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

export type DeepreadonlyCases = [
  Expect<Equal<DeepReadonly<{ a: number }>, { readonly a: number }>>,
  Expect<Equal<DeepReadonly<{ a: { a1: string } }>, { readonly a: { readonly a1: string } }>>,
  Expect<Equal<DeepReadonly<{ a: number[] }>, { readonly a: readonly number[] }>>,
  Expect<Equal<DeepReadonly<number>, number>>,
]

// ========== 5. Tuple to Union ==========

export type TupleToUnion<T extends readonly unknown[]> = T[number]

// https://github.com/type-challenges/type-challenges/issues/7#issuecomment-781402673
const tuple1 = [1, '2', true] as const

export type TupleToUnionCases = [
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

export type ChainableCases = [
  Expect<Alike<typeof chainableTest1, ChainableTest1>>,
]

// ========== 7. Last of Array ==========

// export type Last<T extends unknown[]> = [never, ...T][T['length']]
export type Last<T extends unknown[]> = T extends [...unknown[], infer Tail] ? Tail : never

export type LastCases = [
  Expect<Equal<Last<[]>, never>>,
  Expect<Equal<Last<[1, 2, 3]>, 3>>,
]

// ========== 8. Pop ==========
// ========== 8.1. Push ==========
// ========== 8.2. Shift ==========
// ========== 8.3. Unshift ==========

export type Pop<T extends unknown[]> = T extends [...infer Head, unknown] ? Head : never

export type PopCases = [
  Expect<Equal<Pop<[1, 2, 3, 4]>, [1, 2, 3]>>,
]

// ========== 9. Promise.all ==========

export declare function PromiseAll<T extends readonly unknown[]>(values: readonly [...T]): Promise<{
  [K in keyof T]: T[K] extends Promise<infer R> ? R : T[K]
}>

const promiseAllTest1 = PromiseAll([1, 2, 3] as const)
const promiseAllTest2 = PromiseAll([1, 2, Promise.resolve(3)] as const)
const promiseAllTest3 = PromiseAll([1, 2, Promise.resolve(3)])

export type PromiseAllCases = [
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

export type LookUpCases = [
  Expect<Equal<LookUp<Animal, 'dog'>, Dog>>,
  Expect<Equal<LookUp<Animal, 'cat'>, Cat>>,
]

// ========== 11. Trim Left ==========

export type Space = ' ' | '\n' | '\t'

export type TrimLeft<S extends string> = S extends `${Space}${infer F}` ? TrimLeft<F> : S

export type TrimLeftCases = [
  Expect<Equal<TrimLeft<'str'>, 'str'>>,
  Expect<Equal<TrimLeft<' str'>, 'str'>>,
  Expect<Equal<TrimLeft<' str '>, 'str '>>,
  Expect<Equal<TrimLeft<'  str '>, 'str '>>,
]

// ========== 12 Trim Right ==========

export type TrimRight<S extends string> = S extends `${infer F}${Space}` ? TrimRight<F> : S

export type TrimRightCases = [
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

export type MyCapitalizeCases = [
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

// ========== 15. Replace ==========

export type Replace<S extends string, From extends string, To extends string> =
  From extends '' | To
    ? S
    : (S extends `${infer Left}${From}${infer Right}`
        ? `${Left}${To}${Right}`
        : S)

export type ReplaceCases = [
  Expect<Equal<Replace<'', '', ''>, ''>>,
  Expect<Equal<Replace<'foo', 'foo', 'foo'>, 'foo'>>,
  Expect<Equal<Replace<'foo', 'foo', 'bar'>, 'bar'>>,
  Expect<Equal<Replace<'foofoo', 'foo', 'bar'>, 'barfoo'>>,
  Expect<Equal<Replace<'foobarbar', '', 'bar'>, 'foobarbar'>>,
  Expect<Equal<Replace<'foobarbar', 'bar', ''>, 'foobar'>>,
]

// ========== 16. ReplaceAll ==========

export type ReplaceAll<S extends string, From extends string, To extends string> =
  From extends '' | To
    ? S
    : (S extends `${infer Left}${From}${infer Right}`
        ? `${Left}${To}${ReplaceAll<Right, From, To>}`
        : S)

export type ReplaceAllCases = [
  Expect<Equal<ReplaceAll<'', '', ''>, ''>>,
  Expect<Equal<ReplaceAll<'t y p e s', ' ', ''>, 'types'>>,
  Expect<Equal<ReplaceAll<'foobarbar', '', 'foo'>, 'foobarbar'>>,
  // !!!
  Expect<Equal<ReplaceAll<'foobarfoobar', 'ob', 'b'>, 'fobarfobar'>>,
  Expect<Equal<ReplaceAll<'foboorfoboar', 'bo', 'b'>, 'foborfobar'>>,
]

// ========== 17. Append Argument ==========

export type AppendArgument<Fn extends Function, A> = Fn extends (...args: infer R) => infer P ? (...args: [...R, A]) => P : never

export type AppendArgumentCases = [
  Expect<Equal<AppendArgument<() => number, number>, (x: number) => number>>,
  Expect<Equal<AppendArgument<(a: string) => number, number>, (a: string, x: number) => number>>,
  Expect<Equal<AppendArgument<(a: string) => number, undefined>, (a: string, x: undefined) => number>>,
  Expect<Equal<AppendArgument<(a: string, b: boolean) => number, undefined>, (a: string, b: boolean, x: undefined) => number>>,
]

// ========== 18. Permutation <全排列> ==========

// export type Permutation<T> = [T]
// export type Permutation<T> = T[] extends never[] ? [] : T[] // ❌
// export type Permutation<T> = [T] extends [never] ? [] : [T] // ⭕️
export type IsNever<T> = [T] extends [never] ? true : false // 👍

// https://github.com/type-challenges/type-challenges/issues/614#issuecomment-790210311 // 💡
// export type LoopUnion<Union extends string, Item extends string = Union> = Item extends Item ? `loop ${Item}` : never
// export type LoopUnionTest1 = LoopUnion<'a' | 'b' | 'c'> // 'loop a' | 'loop b' | 'loop c'

// https://github.com/type-challenges/type-challenges/issues/614#issue-779242337 // 👏
export type Permutation<Union, Item = Union> = IsNever<Union> extends true ? [] : Item extends Item ? [Item, ...Permutation<Exclude<Union, Item>>] : never

export type PermutationCases = [
  Expect<Equal<Permutation<1>, [1]>>,
  Expect<Equal<Permutation<never>, []>>,
  Expect<Equal<Permutation<1 | 2>, [1, 2] | [2, 1]>>,
  Expect<Equal<Permutation<1 | 2 | 3>, [1, 2, 3] | [1, 3, 2] | [2, 1, 3] | [2, 3, 1] | [3, 1, 2] | [3, 2, 1]>>,
]

// ========== 19. Length of String ==========

export type LengthOfString<S extends string, U extends string[] = []> =
  S extends `${string}${infer F}`
    ? LengthOfString<F, [string, ...U]>
  //                  ^^^^^^^^^^^^^^ String to Array
    : Length<U>

export type LengthOfStringCases = [
  Expect<Equal<LengthOfString<''>, 0>>,
  Expect<Equal<LengthOfString<'kumiko'>, 6>>,
  Expect<Equal<LengthOfString<'reina'>, 5>>,
  Expect<Equal<LengthOfString<'Sound! Euphonium'>, 16>>,
]

// ========== 20. Flatten ==========

export type Flatten<T extends unknown[]> =
  T extends [infer Head, ...infer Rest]
    ? (Head extends unknown[]
        ? [...Flatten<Head>, ...Flatten<Rest>]
        : [Head, ...Flatten<Rest>])
    : []

export type FlattenCases = [
  Expect<Equal<Flatten<[1, [2]]>, [1, 2]>>,
]

// ========== 21. Append to Object ==========

export type AppendToObject<T, K extends PropertyKey, V> = MergeInsertions<{ [key in K]: V } & T>

// export type AppendToObject<T, K extends Exclude<string, keyof T>, V> = {
//   [key in keyof T | K]: key extends keyof T ? T[key] : V
// }

export type AppendToObjectCases = [
  Expect<Equal<AppendToObject<{}, 'a', number>, { a: number }>>,
  Expect<Equal<AppendToObject<{ b: boolean }, 'a', number>, { a: number; b: boolean }>>,
]

// ========== 22. Absolute ==========

export type Absolute<T extends number | string | bigint> = `${T}` extends `-${infer Str}` ? Absolute<Str> : `${T}`

export type AbsoluteCases = [
  Expect<Equal<Absolute<1>, '1'>>,
  Expect<Equal<Absolute<-1>, '1'>>,
  Expect<Equal<Absolute<0>, '0'>>,
  Expect<Equal<Absolute<-0>, '0'>>,
  Expect<Equal<Absolute<101>, '101'>>,
  Expect<Equal<Absolute<-101>, '101'>>,
  Expect<Equal<Absolute<-1_000_000n>, '1000000'>>,
  Expect<Equal<Absolute<9_999n>, '9999'>>,
]

// ========== 23. String to Union ==========

export type StringToUnion<S extends string> = S extends `${infer Head}${infer Rest}` ? (Head | StringToUnion<Rest>) : never

export type StringToUnionCase = [
  Expect<Equal<StringToUnion<''>, never>>,
  Expect<Equal<StringToUnion<'t'>, 't'>>,
  Expect<Equal<StringToUnion<'hello'>, 'h' | 'e' | 'l' | 'l' | 'o'>>,
  Expect<Equal<StringToUnion<'coronavirus'>, 'c' | 'o' | 'r' | 'o' | 'n' | 'a' | 'v' | 'i' | 'r' | 'u' | 's'>>,
]

// ========== 24. Merge ==========

export type Merge<A, B> = {
  [K in keyof B | keyof A]: K extends keyof B ? B[K] : K extends keyof A ? A[K] : never
}

export type MergeCase = [
  Expect<Equal<Merge<{ a: number }, { b: number }>, { a: number; b: number }>>,
  Expect<Equal<Merge<{ a: number; b: number }, { b: string; c: boolean }>, { a: number; b: string; c: boolean }>>,
]

// ========== 25. KebabCase ==========

type Convert<S> = S extends `${infer Left}${infer Right}`
  ? Uncapitalize<Left> extends Left
    ? `${Left}${Convert<Right>}`
    : `-${Uncapitalize<Left>}${Convert<Right>}`
  : S

type KebabCase<S> = S extends `${infer Left}${infer Right}`
  ? Uncapitalize<Left> extends Left
    ? `${Left}${Convert<Right>}`
    : `${Uncapitalize<Left>}${Convert<Right>}`
  : S

export type KebabCaseCases = [
  Expect<Equal<KebabCase<'FooBarBaz'>, 'foo-bar-baz'>>,
  Expect<Equal<KebabCase<'fooBarBaz'>, 'foo-bar-baz'>>,
  Expect<Equal<KebabCase<'foo-bar'>, 'foo-bar'>>,
  Expect<Equal<KebabCase<'foo_bar'>, 'foo_bar'>>,
  Expect<Equal<KebabCase<'Foo-Bar'>, 'foo--bar'>>,
  Expect<Equal<KebabCase<'ABC'>, 'a-b-c'>>,
  Expect<Equal<KebabCase<'-'>, '-'>>,
  Expect<Equal<KebabCase<''>, ''>>,
  Expect<Equal<KebabCase<'😎'>, '😎'>>,
]

// ========== 26. Diff ==========

export type Diff<A, B> = Merge<{
  [key in Exclude<keyof B, keyof A>]: B[key]
}, {
  [key in Exclude<keyof A, keyof B>]: A[key]
}>

export type DiffCases = [
  Expect<Equal<Diff<{ a: number }, { a: number; b: string }>, { b: string }>>,
  Expect<Equal<Diff<{ a: number }, { b: string }>, { a: number; b: string }>>,
]

// ========== 27. AnyOf ==========

export type Falsy = false | 0 | '' | undefined | null | [] | { [key: string]: never }
export type AnyOf<T extends readonly unknown[]> = T[number] extends Falsy ? false : true

export type AnyOfCases = [
  Expect<Equal<AnyOf<[1, 'test', true, [1], { name: 'test' }, { 1: 'test' }]>, true>>,
  Expect<Equal<AnyOf<[1, '', false, [], {}]>, true>>,
  Expect<Equal<AnyOf<[0, 'test', false, [], {}]>, true>>,
  Expect<Equal<AnyOf<[0, '', true, [], {}]>, true>>,
  Expect<Equal<AnyOf<[0, '', false, [1], {}]>, true>>,
  Expect<Equal<AnyOf<[0, '', false, [], { name: 'test' }]>, true>>,
  Expect<Equal<AnyOf<[0, '', false, [], { 1: 'test' }]>, true>>,
  Expect<Equal<AnyOf<[0, '', false, [], { name: 'test' }, { 1: 'test' }]>, true>>,
  Expect<Equal<AnyOf<[0, '', false, [], {}, undefined, null]>, false>>,
  Expect<Equal<AnyOf<[]>, false>>,
]
