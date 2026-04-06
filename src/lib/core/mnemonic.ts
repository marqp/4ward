import { WORDLIST } from './wordlist';

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  // Remove spaces, newlines, etc. before decoding
  const cleanBase64 = base64.replace(/[\s\r\n]+/g, '');
  const binary_string = atob(cleanBase64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

export function bytesToMnemonic(bytes: Uint8Array): string[] {
  const words: string[] = [];
  let buffer = 0;
  let bits = 0;

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 11) {
      const index = (buffer >>> (bits - 11)) & 0x7ff;
      words.push(WORDLIST[index]);
      bits -= 11;
    }
  }

  if (bits > 0) {
    const index = (buffer << (11 - bits)) & 0x7ff;
    words.push(WORDLIST[index]);
  }

  return words;
}

export function mnemonicToBytes(words: string[]): Uint8Array {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const word of words) {
    const index = WORDLIST.indexOf(word.toLowerCase());
    if (index === -1) throw new Error(`Palavra inválida: ${word}`);

    buffer = (buffer << 11) | index;
    bits += 11;
    while (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}
