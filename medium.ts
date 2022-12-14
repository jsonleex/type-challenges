import type { Alike, Equal, Expect, MergeInsertions } from '@type-challenges/utils'
import type { Includes, Length } from './easy'
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

// ========== 12. Trim Right ==========

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

// ========== 18. Permutation <?????????> ==========

// export type Permutation<T> = [T]
// export type Permutation<T> = T[] extends never[] ? [] : T[] // ???
// export type Permutation<T> = [T] extends [never] ? [] : [T] // ??????
export type IsNever<T> = [T] extends [never] ? true : false // ????

// https://github.com/type-challenges/type-challenges/issues/614#issuecomment-790210311 // ????
// export type LoopUnion<Union extends string, Item extends string = Union> = Item extends Item ? `loop ${Item}` : never
// export type LoopUnionTest1 = LoopUnion<'a' | 'b' | 'c'> // 'loop a' | 'loop b' | 'loop c'

// https://github.com/type-challenges/type-challenges/issues/614#issue-779242337 // ????
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

export type StringToUnion<S> = S extends `${infer Head}${infer Rest}` ? Head | StringToUnion<Rest> : S

export type StringToUnionCase = [
  Expect<Equal<StringToUnion<''>, ''>>,
  Expect<Equal<StringToUnion<'t'>, 't' | ''>>,
  Expect<Equal<StringToUnion<'hello'>, 'h' | 'e' | 'l' | 'l' | 'o' | ''>>,
  Expect<Equal<StringToUnion<'coronavirus'>, 'c' | 'o' | 'r' | 'o' | 'n' | 'a' | 'v' | 'i' | 'r' | 'u' | 's' | ''>>,
]

// ========== 24. Merge ==========

export type Merge<A, B> = A & B extends infer R ? { [K in keyof R]: R[K] } : never

export type MergeCase = [
  Expect<Equal<Merge<{ a: number }, { b: number }>, { a: number; b: number }>>,
  // Expect<Equal<Merge<{ a: number; b: number }, { b: string; c: boolean }>, { a: number; b: string; c: boolean }>>,
]

export type Merge2<T> = T extends object
  ? { [key in keyof T]: T[key] }
  : T

export type Merge2Case = [
  Expect<Equal<Merge2<{ a: number } & { b: number }>, { a: number; b: number }>>,
  Expect<Equal<Merge2<{ a: number; b: number } & { b: string; c: boolean }>, { a: number; b: never; c: boolean }>>,
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
  Expect<Equal<KebabCase<'????'>, '????'>>,
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

// ========== 28. IsNever ==========
// Has been implemented in Permutation

// ========== 29. IsUnion ==========

// type A = 'a'
// type B = 'a' | 'b'

// const b1: B[] = ['a', 'b'] // ??????
// const b2: [B] = ['a'] // ??????
// const b2: [B] = ['b'] // ??????
// const b2: [B] = ['a', 'b'] // ???

// type AA = A extends A ? true : false
//        ^^^^^^^^^^^ => 'a' === 'a'
// type AB = A extends B ? true : false
//        ^^^^^^^^^^^ => 'a' === 'a' || 'a' === 'b'
// type BA = B extends A ? true : false
//        ^^^^^^^^^^^ => 'a' === 'a' && 'b' === 'a'
// When conditional types act on a generic type, they become distributive when given a union type. For example, take the following:
// https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types

export type IsUnion<T, Copy = T> =
  //                     ^^^^^^^^ `T extends T` will assign T, so need Copy to keep the original value
  IsNever<T> extends true
    ? false
    : T extends T
      ? [Copy] extends [T] ? false : true
      : false

export type IsUnionCases = [
  Expect<Equal<IsUnion<string>, false>>,
  Expect<Equal<IsUnion<string | number>, true>>,
  Expect<Equal<IsUnion<'a' | 'b' | 'c' | 'd'>, true>>,
  Expect<Equal<IsUnion<undefined | null | void | ''>, true>>,
  Expect<Equal<IsUnion<{ a: string } | { a: number }>, true>>,
  Expect<Equal<IsUnion<{ a: string | number }>, false>>,
  Expect<Equal<IsUnion<[string | number]>, false>>,

  // Cases where T resolves to a non-union type.
  Expect<Equal<IsUnion<string | never>, false>>,
  Expect<Equal<IsUnion<string | unknown>, false>>,
  Expect<Equal<IsUnion<string | any>, false>>,
  Expect<Equal<IsUnion<string | 'a'>, false>>,

  // https://github.com/type-challenges/type-challenges/issues/14516#issuecomment-1243617906
  Expect<Equal<IsUnion<never>, false>>,
]

// ========== 30. Replace Keys ==========

// export type ReplaceKeys<Target, Keys extends number | string, Value> = Target extends Target ? Merge<Omit<Target, Keys>, {
//   [key in keyof Value & Keys & keyof Target]: Value[key]
// }> : never

type ReplaceKeys<Target, Keys extends number | string, Value> = Target extends Target
  ? {
      [k in keyof Target]: k extends Keys
        ? k extends keyof Value ? Value[k] : never
        : Target[k]
    }
  : never

export type ReplaceKeysCases = [
  Expect<Equal<ReplaceKeys<{ a: number }, 'a', { a: string }>, { a: string }>>,
  Expect<Equal<ReplaceKeys<{ a: number; b: number }, 'a', { a: string }>, { a: string; b: number }>>,
  Expect<Equal<ReplaceKeys<{ a: number; b: number }, 'aa', { a: string }>, { a: number; b: number }>>,
]

// ========== 31. Remove Index Signature ==========

export type RemoveIndexSignature<Target> = {
  [Key in keyof Target as (
    string extends Key
      ? never
      : number extends Key
        ? never
        : symbol extends Key
          ? never
          : Key
  )]: Target[Key]
}

const symbolFoo = Symbol('foo')

export type RemoveIndexSignatureCases = [
  Expect<Equal<RemoveIndexSignature<{}>, {}>>,
  Expect<Equal<RemoveIndexSignature<{ [key: string]: unknown }>, {}>>,
  Expect<Equal<RemoveIndexSignature<{ [key: number]: unknown }>, {}>>,
  Expect<Equal<RemoveIndexSignature<{ [key: symbol]: unknown }>, {}>>,
  Expect<Equal<RemoveIndexSignature<{ [key: string | number | symbol]: unknown }>, {}>>,
  Expect<Equal<RemoveIndexSignature<{ a: unknown }>, { a: unknown }>>,
  Expect<Equal<RemoveIndexSignature<{ fn(): unknown }>, { fn(): unknown }>>,
  Expect<Equal<RemoveIndexSignature<{ [symbolFoo]: unknown }>, { [symbolFoo]: unknown }>>,
  Expect<Equal<RemoveIndexSignature<{ [symbolFoo](): unknown }>, { [symbolFoo](): unknown }>>,
]

// ========== 32. Percentage Parse ==========

export type PercentageParser<T extends string, S = ''> = T extends `${infer H extends '+' | '-'}${infer R}`
  ? PercentageParser<R, H>
  : T extends `${infer N}%`
    ? [S, N, '%']
    : [S, T, '']

export type PercentageParseCases = [
  Expect<Equal<PercentageParser<''>, ['', '', '']>>,
  Expect<Equal<PercentageParser<'0'>, ['', '0', '']>>,
  Expect<Equal<PercentageParser<'+'>, ['+', '', '']>>,
  Expect<Equal<PercentageParser<'+0'>, ['+', '0', '']>>,
  Expect<Equal<PercentageParser<'+0%'>, ['+', '0', '%']>>,
  Expect<Equal<PercentageParser<'100'>, ['', '100', '']>>,
  Expect<Equal<PercentageParser<'+100'>, ['+', '100', '']>>,
  Expect<Equal<PercentageParser<'+100%'>, ['+', '100', '%']>>,
  Expect<Equal<PercentageParser<'-'>, ['-', '', '']>>,
  Expect<Equal<PercentageParser<'-0'>, ['-', '0', '']>>,
  Expect<Equal<PercentageParser<'-0%'>, ['-', '0', '%']>>,
  Expect<Equal<PercentageParser<'100'>, ['', '100', '']>>,
  Expect<Equal<PercentageParser<'-100'>, ['-', '100', '']>>,
  Expect<Equal<PercentageParser<'-100%'>, ['-', '100', '%']>>,
]

// ========== 33. Drop Char ==========

export type DropChar<S extends string, D extends string> = S extends `${infer L}${D}${infer R}`
  ? `${L}${DropChar<R, D>}`
  : S

// Or Use ReplaceAll<S, D, ''>

export type DropCharCases = [
  Expect<Equal<DropChar<'', ''>, ''>>,
  Expect<Equal<DropChar<'a', ''>, 'a'>>,
  Expect<Equal<DropChar<'a', 'a'>, ''>>,
  Expect<Equal<DropChar<'', 'a'>, ''>>,
  Expect<Equal<DropChar<'ab', 'a'>, 'b'>>,
  Expect<Equal<DropChar<'abacad', 'a'>, 'bcd'>>,
]

// ========== 34. MinusOne ==========

// T => Array.length => Array.pop => Array.length
// type MinusOne<T extends number, U extends unknown[] = [], R extends number = 0> = U extends { length: T }
//   ? R
//   : MinusOne<T, [...U, 1], U['length']>

// Type instantiation is excessively deep and possibly infinite.ts(2589)
// type X = MinusOne<1000>

// export type MinusOne<T extends number> = 0

// export type MinusOneCases = [
//   Expect<Equal<MinusOne<1>, 0>>,
//   Expect<Equal<MinusOne<2>, 1>>,
// ]

// ========== 35. Pick By Type ==========

export type PickByType<T, U> = {
  [Key in keyof T as T[Key] extends U ? Key : never]: T[Key]
}

export type PickByTypeCases = [
  Expect<Equal<PickByType<{ a: string; b: boolean }, string>, { a: string }>>,
  Expect<Equal<PickByType<{ a: ''; b: boolean }, string>, { a: '' }>>,
  Expect<Equal<PickByType<{ a: string; b: boolean }, boolean>, { b: boolean }>>,
  Expect<Equal<PickByType<{ a: string; b: false }, boolean>, { b: false }>>,
]

// ========== 36. Starts With ==========

export type StartsWith<T extends string, U extends string> = T extends `${U}${string}` ? true : false

export type StartWithCases = [
  Expect<Equal<StartsWith<'', ''>, true>>,
  Expect<Equal<StartsWith<'a', 'a'>, true>>,
  Expect<Equal<StartsWith<'ab', 'a'>, true>>,
  Expect<Equal<StartsWith<'ab', 'ac'>, false>>,
  Expect<Equal<StartsWith<'ab', 'abc'>, false>>,
]

// ========== 37. Ends With ==========

export type EndsWith<T extends string, U extends string> = T extends `${string}${U}` ? true : false

export type EndsWithCase = [
  Expect<Equal<EndsWith<'', ''>, true>>,
  Expect<Equal<EndsWith<'a', 'a'>, true>>,
  Expect<Equal<EndsWith<'ab', 'a'>, false>>,
  Expect<Equal<EndsWith<'ab', 'ac'>, false>>,
  Expect<Equal<EndsWith<'ab', 'abc'>, false>>,
]

// ========== 38. Partial by Keys ==========

export type PartialByKeys<T extends object, K extends keyof T = keyof T> = {
  [P in keyof T & K]?: T[P]
} & {
  [P in Exclude<keyof T, K>]: T[P]
  // inline Exclude
} extends infer R ? { [P in keyof R]: R[P] } : never
// inline Merger

export type PartialByKeysCases = [
  Expect<Equal<PartialByKeys<{ a: number; b: boolean }, 'a'>, { a?: number; b: boolean }>>,
  Expect<Equal<PartialByKeys<{ a: number; b: boolean }, 'a' | 'b'>, Partial<{ a: number; b: boolean }>>>,
]

// ========== 39. Required by Keys ==========

export type RequiredByKey<T extends object, K = keyof T> = Merge<
  Pick<T, Exclude<keyof T, K>>,
  Required<Pick<T, Extract<keyof T, K>>>
>

export type RequiredByKeyCases = [
  Expect<Equal<RequiredByKey<{ a?: number; b?: boolean }, 'a'>, { a: number; b?: boolean }>>,
  Expect<Equal<RequiredByKey<{ a?: number; b?: boolean }, 'a' | 'b'>, Required<{ a?: number; b?: boolean }>>>,
]

// ========== 40. Mutable ==========

export type Mutable<T extends object> = {
  -readonly [P in keyof T]: T[P]
}

export type MutableCases = [
  Expect<Equal<Mutable<{ readonly a: number }>, { a: number }>>,
  Expect<Equal<Mutable<{ readonly a?: number }>, { a?: number }>>,
  Expect<Equal<Mutable<{ readonly a?: number; readonly b: boolean }>, { a?: number; b: boolean }>>,
]

// ========== 41. Omit by Type ==========

export type OmitByType<T extends object, U> = {
  [P in keyof T as T[P] extends U ? never : P]: T[P]
}

export type OmitByTypeCases = [
  Expect<Equal<OmitByType<{ a?: 1 }, number | undefined>, {}>>,
  Expect<Equal<OmitByType<{ a: number }, number>, {}>>,
  Expect<Equal<OmitByType<{ a: number; b: number }, number>, {}>>,
  Expect<Equal<OmitByType<{ a: number; b: boolean }, number>, { b: boolean }>>,
  Expect<Equal<OmitByType<{ a: number; b: boolean }, number | boolean>, {}>>,
]

// ========== 42. ObjectEntries ==========

export type ObjectEntries<T extends object, K = keyof T> = K extends keyof T ? [K, T[K]] : never

export type ObjectEntriesCases = [
  Expect<Equal<ObjectEntries<{ a: 1; b: true }>, ['a', 1] | ['b', true]>>,
  Expect<Equal<ObjectEntries<{ a: number; b: boolean }>, ['a', number] | ['b', boolean]>>,
  Expect<Equal<ObjectEntries<{ a?: number; b: boolean }>, ['a', number | undefined] | ['b', boolean]>>,
  Expect<Equal<ObjectEntries<{ a: number | undefined; b: boolean }>, ['a', number | undefined] | ['b', boolean]>>,
  Expect<Equal<ObjectEntries<{ a: number | undefined; b: boolean | null }>, ['a', number | undefined] | ['b', boolean | null]>>,
]

// ========== 43. Shift ==========

export type Shift<T extends unknown[]> = T extends [unknown, ...infer R] ? R : T

export type ShiftCases = [
  // @ts-expect-error: Invalid Input
  Shift<unknown>,

  Expect<Equal<Shift<[]>, []>>,
  Expect<Equal<Shift<[1]>, []>>,
  Expect<Equal<Shift<[3, 2, 1]>, [2, 1]>>,
  Expect<Equal<Shift<['a', 'b', 'c', 'd']>, ['b', 'c', 'd']>>,
]

// ========== 44. Tuple to Nested Object ==========

export type TupleToNestedObject<T extends unknown[], U> = T extends [infer H, ...infer R]
  ? { [Key in H & PropertyKey]: TupleToNestedObject<R, U> }
  : U

export type TupleToNestedObjectCases = [
  Expect<Equal<TupleToNestedObject<['a'], string>, { a: string }>>,
  Expect<Equal<TupleToNestedObject<['a', 'b'], number>, { a: { b: number } }>>,
  Expect<Equal<TupleToNestedObject<['a', 'b', 'c'], boolean>, { a: { b: { c: boolean } } }>>,
  Expect<Equal<TupleToNestedObject<[], boolean>, boolean>>,
]

// ========== 45. Reverse ==========

export type Reverse<T extends unknown[]> = T extends [infer H, ...infer R] ? [...Reverse<R>, H] : T

export type ReverseCases = [
  Expect<Equal<Reverse<[]>, []>>,
  Expect<Equal<Reverse<['a', 'b']>, ['b', 'a']>>,
  Expect<Equal<Reverse<['a', 'b', 'c']>, ['c', 'b', 'a']>>,
]

// ========== 46. Flip Arguments ==========

// export type FlipArguments<Fn extends Function> = Fn extends (...args: infer A) => infer P ? (...args: Reverse<A>) => P : never
export type FlipArguments<T extends (...args: never[]) => unknown> = (...args: Reverse<Parameters<T>>) => ReturnType<T>

export type FlipArgumentsCases = [
  Expect<Equal<() => string, () => string>>,
  Expect<Equal<FlipArguments<(a: number) => string>, (a: number) => string>>,
  Expect<Equal<FlipArguments<(a: number, b: boolean) => string>, (a: boolean, b: number) => string>>,
  Expect<Equal<FlipArguments<(a: number, b: boolean, c: string) => string>, (a: string, b: boolean, c: number) => string>>,
]

// ========== 47. FlattenDepth ==========

export type FlattenDepth<T extends unknown[], D = 1, U extends unknown[] = []> = T extends [infer H, ...infer R]
  ? H extends unknown[]
    ? U extends { length: D }
      ? [H, ...FlattenDepth<R, D, U>]
      : [...FlattenDepth<H, D, [0, ...U]>, ...FlattenDepth<R, D, U>]
    : [H, ...FlattenDepth<R, D, U>]
  : T

export type FlattenDepthCases = [
  Expect<Equal<FlattenDepth<[]>, []>>,
  Expect<Equal<FlattenDepth<[1, 2, 3, 4]>, [1, 2, 3, 4]>>,
  Expect<Equal<FlattenDepth<[1, [2]]>, [1, 2]>>,
  Expect<Equal<FlattenDepth<[1, 2, [3, 4], [[[5]]]], 2>, [1, 2, 3, 4, [5]]>>,
  Expect<Equal<FlattenDepth<[1, 2, [3, 4], [[[5]]]]>, [1, 2, 3, 4, [[5]]]>>,
  Expect<Equal<FlattenDepth<[1, [2, [3, [4, [5]]]]], 3>, [1, 2, 3, 4, [5]]>>,
  Expect<Equal<FlattenDepth<[1, [2, [3, [4, [5]]]]], 19260817>, [1, 2, 3, 4, 5]>>,
]

// ========== 48. BEM style string ==========

type Prefix<S extends string, A extends string> = [S] extends [never]
  ? ''
  : S extends ''
    ? S
    : A extends ''
      ? S
      : `${A}${S}`

export type BEM<B extends string, E extends string[], M extends string[]> = `${B}${Prefix<E[number], '__'>}${Prefix<M[number], '--'>}`

export type BEMCases = [
  Expect<Equal<BEM<'B', ['E'], ['M']>, 'B__E--M'>>,
  Expect<Equal<BEM<'B', ['E'], []>, 'B__E'>>,
  Expect<Equal<BEM<'B', [], ['M']>, 'B--M'>>,
  Expect<Equal<BEM<'B', ['E1', 'E2'], ['M']>, 'B__E1--M' | 'B__E2--M'>>,
  Expect<Equal<BEM<'B', ['E1', 'E2'], ['M1', 'M2']>, 'B__E1--M1' | 'B__E1--M2' | 'B__E2--M1' | 'B__E2--M2'>>,
]

// ========== 49. Inorder Tree Traversal ==========

interface TreeNode {
  value: number
  left: TreeNode | null
  right: TreeNode | null
}

export type InorderTraversal<T extends TreeNode | null> = [T] extends [TreeNode]
  ? [...InorderTraversal<T['left']>, T['value'], ...InorderTraversal<T['right']>]
  : []

const tree1 = {
  value: 1,
  left: null,
  right: {
    value: 2,
    left: {
      value: 3,
      left: {
        value: 4,
        left: null,
        right: {
          value: 5,
          left: null,
          right: null,
        },
      },
      right: null,
    },
    right: null,
  },
} as const

export type InorderTraversalCases = [
  Expect<Equal<InorderTraversal<null>, []>>,
  Expect<Equal<InorderTraversal<typeof tree1>, [1, 4, 5, 3, 2]>>,
]

// ========== 50. Flip Object ==========

export type FlipObject<T extends Record<PropertyKey, string | boolean | number>> = {
  [K in keyof T as `${T[K]}`]: K extends `${infer B extends boolean}` ? B : K
}

export type FlipObjectCase = [
  Expect<Equal<FlipObject<{ a: 1; b: 2 }>, { 1: 'a'; 2: 'b' }>>,
  Expect<Equal<FlipObject<{ a: true; false: 2 }>, { true: 'a'; 2: false }>>,
]

// ========== 51. Fibonacci Sequence ==========

export type Fibonacci<T extends number, N1 extends number[] = [], N2 extends number[] = [number], R extends number[] = [number]> =
  T extends 0
    ? never
    : R extends { length: T }
      ? N2['length']
      : Fibonacci<T, N2, [...N1, ...N2], [...R, number]>

export type FibonacciCases = [
  Expect<Equal<Fibonacci<1>, 1>>,
  Expect<Equal<Fibonacci<2>, 1>>,
  Expect<Equal<Fibonacci<3>, 2>>,
  Expect<Equal<Fibonacci<8>, 21>>,
]

// function fibonacci(n = 1, a = 0, b = 1, c = 1): number {
//   if (n < 1)
//     throw new RangeError('Input must be a positive integer')

//   return c === n ? b : fibonacci(n, b, a + b, c + 1)
// }

// ========== 52. String All Combinations ==========

// type StringCombinations<U extends string, I extends string = U> = I extends I
//   ? I | `${I}${StringCombinations<Exclude<U, I>>}`
//   : never

// export type StringAllCombinations<S extends string> = '' | StringCombinations<StringToUnion<S>>

export type StringAllCombinations<S extends string, U extends string = StringToUnion<S>, I extends string = U> =
  S extends `${string}${infer R}`
    ? I extends I
      ? `${I}${StringAllCombinations<R, I extends '' ? U : Exclude<U, I>>}`
      : never
    : ''

export type StringPermutationCases = [
  Expect<Equal<StringAllCombinations<''>, ''>>,
  Expect<Equal<StringAllCombinations<'a'>, '' | 'a'>>,
  Expect<Equal<StringAllCombinations<'ab'>, '' | 'a' | 'ab' | 'b' | 'ba'>>,
  Expect<Equal<StringAllCombinations<'abc'>, '' | 'a' | 'b' | 'c' | 'ab' | 'ac' | 'bc' | 'ba' | 'bc' | 'ca' | 'cb' | 'abc' | 'acb' | 'bac' | 'bca' | 'cab' | 'cba'>>,
]

// function stringAllCombinations(str: string) {
//   const result: string[] = []
//   const tuple: string[] = str.split('')

//   let head: string | undefined = ''

//   while (head) {
//     tuple.forEach(s => result.push(`${head}${s}`))
//     head = tuple.pop()
//   }

//   return result
// }

// ========== 53. Greater Than ==========

export type GreaterThan<A extends number, B extends number, R extends number[] = []> =
  R extends { length: A }
    ? false
    : R extends { length: B }
      ? true
      : GreaterThan<A, B, [...R, number]>

export type GreaterThanCases = [
  Expect<Equal<GreaterThan<1, 0>, true>>,
  Expect<Equal<GreaterThan<1, 1>, false>>,
  Expect<Equal<GreaterThan<1, 2>, false>>,
  // https://github.com/type-challenges/type-challenges/issues/4875#issue-1069016517
  // Expect<Equal<GreaterThan<1210000000000110, 1192100607010116>, true>>,
]

// ========== 54. Zip ==========

export type Zip<T extends unknown[], U extends unknown[], R extends unknown[] = []> =
  T extends [infer T1, ...infer TR]
    ? U extends [infer U1, ...infer UR]
      ? Zip<TR, UR, [...R, [T1, U1]]>
      : R
    : R

export type ZipCases = [
  Expect<Equal<Zip<[], []>, []>>,
  Expect<Equal<Zip<[1], ['a']>, [[1, 'a']]>>,
  Expect<Equal<Zip<[1, 2], ['a']>, [[1, 'a']]>>,
  Expect<Equal<Zip<[1, 2], ['a', 'b']>, [[1, 'a'], [2, 'b']]>>,
  Expect<Equal<Zip<[1], ['a', 'b']>, [[1, 'a']]>>,
]

// function zip(a: unknown[], b: unknown[], result: [unknown, unknown][]): [unknown, unknown][] {
//   return a.length === 0 || b.length === 0 ? result : zip(a, b, [...result, [a.shift(), b.shift()]])
// }

// ========== 55. IsTuple ==========

export type IsTuple<T> =
  [T] extends [never]
    ? false
    : T extends readonly unknown[]
      ? number extends T['length']
        ? false
        : true
      : false

export type IsTupleCases = [
  Expect<Equal<IsTuple<[]>, true>>,
  Expect<Equal<IsTuple<[number]>, true>>,
  Expect<Equal<IsTuple<readonly [1]>, true>>,
  Expect<Equal<IsTuple<{ length: 1 }>, false>>,
  Expect<Equal<IsTuple<number[]>, false>>,
  Expect<Equal<IsTuple<never>, false>>,
]

// ========== 56. Chunk ==========

export type Chunk<T extends readonly unknown[], U = 0, R extends unknown[] = []> =
  U extends 0
    ? []
    : R extends { length: U }
      ? [R, ...Chunk<T, U, []>]
      : T extends [infer T1, ...infer TR]
        ? Chunk<TR, U, [...R, T1]>
        : R extends { length: 0 }
          ? []
          : [R]

export type ChunkCases = [
  Expect<Equal<Chunk<[], 0>, []>>,
  Expect<Equal<Chunk<[1, 2, 3, 4, 5, 6], 7>, [[1, 2, 3, 4, 5, 6]]>>,
  Expect<Equal<Chunk<[1, 2, 3, 4, 5, 6], 6>, [[1, 2, 3, 4, 5, 6]]>>,
  Expect<Equal<Chunk<[1, 2, 3, 4, 5, 6], 5>, [[1, 2, 3, 4, 5], [6]]>>,
  Expect<Equal<Chunk<[1, 2, 3, 4, 5, 6], 4>, [[1, 2, 3, 4], [5, 6]]>>,
  Expect<Equal<Chunk<[1, 2, 3, 4, 5, 6], 3>, [[1, 2, 3], [4, 5, 6]]>>,
  Expect<Equal<Chunk<[1, 2, 3, 4, 5, 6], 2>, [[1, 2], [3, 4], [5, 6]]>>,
  Expect<Equal<Chunk<[1, 2, 3, 4, 5, 6], 1>, [[1], [2], [3], [4], [5], [6]]>>,
]

// ========== 57. Fill ==========

export type Fill<T extends unknown[], N, Start = 0, End = T['length'], U extends number[] = [], M = false> =
  T extends [infer H, ...infer R]
    ? U extends { length: End }
      ? T
      : U extends { length: Start }
        ? [N, ...Fill<R, N, Start, End, [...U, number], true>]
        : M extends true
          ? [N, ...Fill<R, N, Start, End, [...U, number], true>]
          : [H, ...Fill<R, N, Start, End, [...U, number], false>]
    : []

export type FillCases = [
  Expect<Equal<Fill<[], 0>, []>>,
  Expect<Equal<Fill<[1, 2, 3, 4], 0>, [0, 0, 0, 0]>>,
  Expect<Equal<Fill<[1, 2, 3, 4], 0, 1>, [1, 0, 0, 0]>>,
  Expect<Equal<Fill<[1, 2, 3, 4], 0, 1, 2>, [1, 0, 3, 4]>>,
]

// ========== 58. WithOut ==========

export type WithOut<T extends unknown[], U extends unknown[]> =
  T extends [infer H, ...infer R]
    ? H extends U[number]
      ? WithOut<R, U>
      : [H, ...WithOut<R, U>]
    : T

export type WithOutCases = [
  Expect<Equal<WithOut<[1, 2, 3, 4], []>, [1, 2, 3, 4]>>,
  Expect<Equal<WithOut<[1, 2, 3, 4], [1]>, [2, 3, 4]>>,
  Expect<Equal<WithOut<[1, 2, 3, 4], [1, 4]>, [2, 3]>>,
]

// ========== 59. Math.trunc ==========

export type Trunc<T extends string | number> = `${T}` extends `${infer N}.${string}` ? N : `${T}`

export type TruncCases = [
  Expect<Equal<Trunc<0.1>, '0'>>,
  Expect<Equal<Trunc<1.1>, '1'>>,
  Expect<Equal<Trunc<123.1>, '123'>>,
  Expect<Equal<Trunc<-123.1>, '-123'>>,
  Expect<Equal<Trunc<'123.1'>, '123'>>,
  Expect<Equal<Trunc<'-123.1'>, '-123'>>,
]

// ========== 60. IndexOf ==========

export type IndexOf<T extends unknown[], U, N extends number[] = []> =
  T extends [infer H, ...infer R]
    ? Equal<H, U> extends true
      ? N['length']
      : IndexOf<R, U, [...N, number]>
    : -1

export type IndexOfCases = [
  Expect<Equal<IndexOf<[1, 2], 1>, 0>>,
  Expect<Equal<IndexOf<[1, 1], 1>, 0>>,
  Expect<Equal<IndexOf<[1, 2, 3, 4], 2>, 1>>,
  Expect<Equal<IndexOf<[1, 2, 3, 4], 6>, -1>>,
  Expect<Equal<IndexOf<[string, 1, number, 'a'], number>, 2>>,
]

// ========== 61. Join ==========

export type Join<T extends (string | number)[], U extends string | number> =
  T extends [infer H extends string | number, ...infer R extends (string | number)[]]
    ? R extends { length: 0 }
      ? `${H}`
      : `${H}${U}${Join<R, U>}`
    : ''

export type JoinCases = [
  Expect<Equal<Join<[], 1>, ''>>,
  Expect<Equal<Join<[1, 2, 3], 1>, '11213'>>,
  Expect<Equal<Join<[1, 2, 3], '-'>, '1-2-3'>>,
]

// ========== 63. LastIndexOf ==========

export type LastIndexOf<T extends unknown[], U> =
  T extends [...infer L, infer R]
    ? Equal<R, U> extends true
      ? L['length']
      : LastIndexOf<L, U>
    : -1

export type LastIndexOfCases = [
  Expect<Equal<LastIndexOf<[1, 2, 3], 1>, 0>>,
  Expect<Equal<LastIndexOf<[1, 2, 1], 1>, 2>>,
]

// ========== 64. Unique ==========

export type Unique<T extends unknown[], U extends unknown[] = []> =
  T extends [infer H, ...infer R]
    ? Includes<U, H> extends true
      ? Unique<R, U>
      : Unique<R, [...U, H]>
    : U

export type UniqueCases = [
  Expect<Equal<Unique<[]>, []>>,
  Expect<Equal<Unique<[1, 1, 2, 2, 3, 3]>, [1, 2, 3]>>,
  Expect<Equal<Unique<[1, 2, 3, 4, 4, 5, 6, 7]>, [1, 2, 3, 4, 5, 6, 7]>>,
  Expect<Equal<Unique<[1, 'a', 2, 'b', 2, 'a']>, [1, 'a', 2, 'b']>>,
  Expect<Equal<Unique<[string, number, 1, 'a', 1, string, 2, 'b', 2, number]>, [string, number, 1, 'a', 2, 'b']>>,
  Expect<Equal<Unique<[unknown, unknown, any, any, never, never]>, [unknown, any, never]>>,
]

// ========== 65. MapTypes ==========

interface MapConf {
  from: unknown
  to: unknown
}

type GetMapType<
  T,
  U extends MapConf,
  R = U extends U
    ? Equal<T, U['from']> extends true
      ? U['to']
      : never
    : never,
> = [R] extends [never] ? T : R

export type MapTypes<T extends object, U extends MapConf> = {
  [K in keyof T]: GetMapType<T[K], U>
}

export type MapTypesCases = [
  Expect<Equal<MapTypes<{}, { from: number; to: string }>, {}>>,
  Expect<Equal<MapTypes<{ a: number }, { from: number; to: string }>, { a: string }>>,
  Expect<Equal<MapTypes<{ a: number; b: string }, { from: number; to: string }>, { a: string; b: string }>>,
  Expect<Equal<MapTypes<{ a: number; b: string }, { from: number; to: string } | { from: string; to: [] }>, { a: string; b: [] }>>,
]

// ========== 66. Construct Tuple ==========

// ========== 67. Number Range ==========

export type NumberRange<
  L extends number,
  H extends number,
  Idx extends 1[] = L extends 0 ? [] : [1, 1],
  Res = never,
> =
  Idx['length'] extends H
    ? H | Res
    : NumberRange<L, H, [...Idx, 1], Idx['length'] | Res>

// ========== 68. Combination ==========

// ========== 69. Subsequence ==========

