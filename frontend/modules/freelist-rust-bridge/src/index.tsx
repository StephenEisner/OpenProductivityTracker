import FreelistRustBridge from './NativeFreelistRustBridge';

export function multiply(a: number, b: number): number {
  return FreelistRustBridge.multiply(a, b);
}
