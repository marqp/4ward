/**
 * Securely overwrites the contents of a TypedArray or an Array of strings
 * in memory to mitigate extraction from RAM after use.
 *
 * NOTE: This is a mitigation, not a guarantee. The JS garbage collector
 * may have created copies of the data in prior heap generations or internal
 * buffers. True secure memory wipe would require WebAssembly with mlock().
 */
export function wipeMemory(data: Uint8Array | string[] | null | undefined): void {
  if (!data) return;
  if (data instanceof Uint8Array) {
    crypto.getRandomValues(data);
    data.fill(0);
  } else if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      data[i] = '';
    }
  }
}
