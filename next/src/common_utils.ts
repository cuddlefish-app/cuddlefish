// See https://github.com/Microsoft/TypeScript/issues/7556.
type ErrorT = { new (message: string): Error };
export function _assert(
  errorType: ErrorT,
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) {
    throw new errorType(message);
  }
}

// See https://github.com/microsoft/TypeScript/issues/46702 and https://github.com/microsoft/TypeScript/issues/46699 as to why we can't have nice things.
export function assert(condition: boolean, message: string): asserts condition {
  _assert(Error, condition, message);
}

export function _assertNotNull<T>(
  errorType: ErrorT,
  v: T | null | undefined,
  message?: string
): asserts v is T {
  _assert(
    errorType,
    !(v === null || v === undefined),
    message || "Expected non-null, non-undefined"
  );
}

export function assertNotNull<T>(v: T | null | undefined): asserts v is T {
  _assertNotNull(Error, v);
}

// Note that currently it is not possible to combine this with `assertNotNull` due to https://github.com/microsoft/TypeScript/issues/40562.
export function _notNull<T>(
  errorType: ErrorT,
  v: T | null | undefined,
  message?: string
): T {
  _assertNotNull(errorType, v, message);
  return v;
}

export function notNull<T>(v: T | null | undefined, message?: string) {
  return _notNull(Error, v, message);
}

// See https://stackoverflow.com/questions/4059147/check-if-a-variable-is-a-string-in-javascript
export const isString = (x: any) =>
  typeof x === "string" || x instanceof String;

export class SafeSet<T> {
  mapping: Map<string, T>;

  constructor(xs: T[]) {
    this.mapping = new Map();
    for (const x of xs) {
      this.mapping.set(JSON.stringify(x), x);
    }
  }

  add(x: T) {
    this.mapping.set(JSON.stringify(x), x);
  }

  has(x: T) {
    return this.mapping.has(JSON.stringify(x));
  }

  delete(x: T) {
    this.mapping.delete(JSON.stringify(x));
  }

  values(): T[] {
    return Array.from(this.mapping.values());
  }

  size(): number {
    return this.mapping.size;
  }
}
