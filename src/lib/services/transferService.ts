/**
 * Transfer service — orchestrates the full send/receive flow.
 *
 * Encapsulates: encryption (with internal compression),
 * passphrase generation, clipboard operations, and payload validation.
 * Keeps App.svelte thin (rendering only).
 */

import { deflateSync, strToU8 } from 'fflate';
import { DICTIONARY_BIN } from '../core/dictionary';
import { encryptData, decryptData } from '../core/crypto';
import { WORDLIST, PASSPHRASE_LENGTH } from '../core/wordlist';
import { transferStore } from '../stores/transferStore.svelte';

// Threshold: QR codes com payload > 4KB geram muitos fragments no Fountain
// encoder (fragmentSize=1000 no QrDisplay). Cada fragment adicional
// aumenta o tempo de transmissão linearmente. 4KB ≈ 5 fragments, que
// a ~450ms/fragment = ~2.3s — ainda aceitável. Acima disso, a UX degrada.
const QR_PAYLOAD_THRESHOLD = 4096;
// Overhead criptográfico: salt(16) + iv(12) + auth tag(16)
const CRYPTO_OVERHEAD = 44;

/**
 * Estimate encrypted payload size from raw text — fast enough for reactive typing.
 * Returns the estimated total byte size (compressed + encrypted overhead).
 */
export function estimatePayloadSize(text: string): number {
  if (!text) return 0;
  const compressed = deflateSync(strToU8(text), {
    level: 9,
    dictionary: DICTIONARY_BIN
  });
  return compressed.length + CRYPTO_OVERHEAD;
}

export function validatePayloadSize(encryptedSize: number): string | null {
  if (encryptedSize > QR_PAYLOAD_THRESHOLD) {
    return 'Aviso: O payload é grande. A transmissão via QR Code pode ser lenta.';
  }
  return null;
}

// ─── Send flow ───

export async function compressAndEncrypt(text: string): Promise<{
  payload: Uint8Array;
  passphrase: string[];
  warning: string | null;
}> {
  const passphrase = generatePassphrase();
  const payload = await encryptData(text, passphrase);
  const warning = validatePayloadSize(payload.length);
  return { payload, passphrase, warning };
}

/**
 * Orchestrates the send action: encrypts data and opens the send modal via the store.
 */
export async function handleSendAction(text: string): Promise<{ error: string | null }> {
  try {
    const { payload, passphrase, warning } = await compressAndEncrypt(text);
    transferStore.openSend(payload, passphrase);
    return { error: warning };
  } catch (err: any) {
    return { error: 'Falha ao encriptar: ' + (err.message || 'Erro desconhecido') };
  }
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
