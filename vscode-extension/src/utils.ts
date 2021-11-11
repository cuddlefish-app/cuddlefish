import * as vscode from "vscode";
const fs = vscode.workspace.fs;

export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertNotNull<T>(v: T | null | undefined): asserts v is T {
  if (v === null || v === undefined) {
    throw new Error(`Expected non-null, non-undefined, but found ${v}`);
  }
}

// Note that currently it is not possible to combine this with `assertNotNull` due to https://github.com/microsoft/TypeScript/issues/40562.
export function notNull<T>(v: T | null | undefined): T {
  if (v === null || v === undefined) {
    throw new Error(`Expected non-null, non-undefined, but found ${v}`);
  }
  return v;
}

export async function directoryExists(path: vscode.Uri): Promise<boolean> {
  try {
    const stat = await fs.stat(path);
    return stat.type === vscode.FileType.Directory;
  } catch (e) {
    if (e instanceof vscode.FileSystemError) {
      if (e.code === "FileNotFound" || e.code === "FileNotADirectory") {
        return false;
      } else {
        console.log(
          `fs.stat returned a FileSystemError with an unexpected code: ${e.code}`
        );
        throw e;
      }
    } else {
      console.error(e);
      throw e;
    }
  }
}

export class DefaultMap<K, V> {
  defaultFn: () => V;
  inner: Map<K, V> = new Map();

  constructor(defaultFn: () => V) {
    this.defaultFn = defaultFn;
    this.inner = new Map();
  }

  get(key: K): V {
    const existing = this.inner.get(key);
    if (existing) {
      return existing;
    } else {
      const value = this.defaultFn();
      this.inner.set(key, value);
      return value;
    }
  }
}

export function mapFromEntries<K, V>(entries: [K, V][]): Map<K, V> {
  const map = new Map();
  for (const [key, value] of entries) {
    map.set(key, value);
  }
  return map;
}

export function logErrors0<T>(f: () => Promise<T>): () => Promise<T> {
  return async () => {
    try {
      return await f();
    } catch (e) {
      console.error(e);
      vscode.window.showErrorMessage(
        "Cuddlefish Comments experienced an error. Check the logs (Developer: Toggle Developer Tools) for more info!"
      );

      // This bit is kind of an ugly hack to make this wrapper easy to use.
      // Often we need to pass things wrapped with this to other code than
      // expects callbacks returning just Promise<T>.
      return undefined as any;
    }
  };
}
export function logErrors1<A1, T>(
  f: (x1: A1) => Promise<T>
): (x1: A1) => Promise<T> {
  return async (x1: A1) => {
    try {
      return await f(x1);
    } catch (e) {
      console.error(e);
      vscode.window.showErrorMessage(
        "Cuddlefish Comments experienced an error. Check the extension logs for more info!"
      );
      return undefined as any;
    }
  };
}
export function logErrors2<A1, A2, T>(
  f: (x1: A1, x2: A2) => Promise<T>
): (x1: A1, x2: A2) => Promise<T> {
  return async (x1: A1, x2: A2) => {
    try {
      return await f(x1, x2);
    } catch (e) {
      console.error(e);
      vscode.window.showErrorMessage(
        "Cuddlefish Comments experienced an error. Check the extension logs for more info!"
      );
      return undefined as any;
    }
  };
}

// See https://stackoverflow.com/questions/4059147/check-if-a-variable-is-a-string-in-javascript
export const isString = (x: any) =>
  typeof x === "string" || x instanceof String;

// Memoization that doesn't require toString'ing the key.
export function asyncMemo1<T, U>(
  f: (x: T) => Promise<U>
): (x: T) => Promise<U> {
  let prev: [T, U] | undefined = undefined;
  return async function (x: T) {
    if (prev !== undefined && x === prev[0]) {
      return prev[1];
    }
    const y = await f(x);
    prev = [x, y];
    return y;
  };
}
