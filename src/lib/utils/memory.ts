/**
 * Securely overwrites the contents of a TypedArray or an Array of strings
 * in memory to mitigate extraction from RAM after use.
 *
 * Strategy:
 *  - Uint8Array: two-pass overwrite — first with random bytes (to foil
 *    simple memory forensics), then zeros (for deterministic cleanup).
 *  - string[]: each string reference is replaced with an empty string.
 *    Note: original string data may still linger in the JS heap / GC;
 *    true secure memory would require WebAssembly with mlock().
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
