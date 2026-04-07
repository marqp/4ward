/**
 * Transfer service — orchestrates the full send/receive flow.
 *
 * Encapsulates: encryption (with internal compression), 
 * passphrase generation, clipboard operations, and payload validation.
 * Keeps App.svelte thin (rendering only).
 */

import { encryptData, decryptData } from '../core/crypto';
import { WORDLIST, PASSPHRASE_LENGTH } from '../core/wordlist';

// ─── Send flow ───

export async function compressAndEncrypt(text: string): Promise<{
  payload: Uint8Array;
  passphrase: string[];
  warning: string | null;
}> {
  const passphrase = generatePassphrase();
  const payload = await encryptData(text, passphrase);
  // Valida o tamanho real do payload comprimido+criptografado
  const warning = validatePayloadSize(payload.length);
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

// Threshold: QR codes acima de ~3KB tornam-se lentos para transmitir via Fountain/QR
const QR_PAYLOAD_THRESHOLD = 4096;

export function validatePayloadSize(encryptedSize: number): string | null {
  if (encryptedSize > QR_PAYLOAD_THRESHOLD) {
    return 'Aviso: O payload é grande. A transmissão via QR Code pode ser lenta.';
  }
  return null;
}

// ─── Receive flow ───

export async function decryptAndDecompress(
  data: Uint8Array,
  passphrase: string[],
): Promise<string> {
  return decryptData(data, passphrase);
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
