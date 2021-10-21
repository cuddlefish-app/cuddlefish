import * as vscode from "vscode";
const fs = vscode.workspace.fs;

export function assert(condition: boolean, message: string): void {
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
