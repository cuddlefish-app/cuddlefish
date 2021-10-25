import * as vscode from "vscode";
const fs = vscode.workspace.fs;

export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
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
        "Cuddlefish Comments experienced an error. Check the extension logs for more info!"
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
