// See https://github.com/Microsoft/TypeScript/issues/7556.
type ErrorT = { new (message: string): Error };

function _notNull<T>(errorType: ErrorT, v: T | null | undefined): T {
  if (v === null || v === undefined) {
    throw new errorType("error message");
  }
  return v;
}

const partial =
  <A, B, T>(f: (a: A, b: B) => T, a: A) =>
  (b: B) =>
    f(a, b);

function partial2<A, B, T>(f: (a: A, b: B) => T, a: A) {
  return (b: B) => f(a, b);
}

// good: (b: number) => number
const sumPartial = partial((a: number, b: number) => a + b, 5);
const sumPartial2 = partial2((a: number, b: number) => a + b, 5);

// good: <T>(v: T | null | undefined) => T
const notNull = <T>(v: T | null | undefined) => _notNull(Error, v);

// bad: (v: unknown) => unknown
const notNull2 = _notNull.bind(null, Error);
const notNull3 = partial(_notNull, Error);
const notNull4 = partial2(_notNull, Error);

export {};
