/**
 * Transfer service — orchestrates the full send/receive flow.
 *
 * Encapsulates: compression, encryption, passphrase generation,
 * clipboard operations, and payload validation.
 * Keeps App.svelte thin (rendering only).
 */

import { compressAndTokenize, decompressAndDetokenize } from '../core/compression';
import { encryptData, decryptData } from '../core/crypto';
import { WORDLIST, PASSPHRASE_LENGTH } from '../core/wordlist';

// ─── Send flow ───

export async function compressAndEncrypt(text: string): Promise<{
  payload: Uint8Array;
  passphrase: string[];
  warning: string | null;
}> {
  const passphrase = generatePassphrase();
  const compressed = compressAndTokenize(text);
  const warning = validatePayloadSize(compressed);
  const payload = await encryptData(compressed, passphrase);
  return { payload, passphrase, warning };
}

export function generatePassphrase(): string[] {
  const words: string[] = [];
  const array = new Uint32Array(PASSPHRASE_LENGTH);
  crypto.getRandomValues(array);
  for (let i = 0; i < PASSPHRASE_LENGTH; i++) {
    words.push(WORDLIST[array[i] % WORDLIST.length]);
  }
  return words;
}

export function validatePayloadSize(compressed: Uint8Array): string | null {
  if (compressed.length > 10240) {
    return 'Aviso: O texto é muito longo (>10KB após compressão). A transmissão pode ser lenta.';
  }
  return null;
}

// ─── Receive flow ───

export async function decryptAndDecompress(
  data: Uint8Array,
  passphrase: string[],
): Promise<string> {
  const decrypted = await decryptData(data, passphrase);
  return decompressAndDetokenize(decrypted);
}

// ─── Clipboard ───

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
