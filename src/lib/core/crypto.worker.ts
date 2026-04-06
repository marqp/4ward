// src/lib/core/crypto.worker.ts

const ITERATIONS = 600000;

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(data: Uint8Array, passphraseWords: string[]): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphraseWords.join(" "), salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new Uint8Array(data)
  );

  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encrypted), salt.length + iv.length);
  return result;
}

export async function decryptData(encryptedData: Uint8Array, passphraseWords: string[]): Promise<Uint8Array> {
  const salt = encryptedData.slice(0, 16);
  const iv = encryptedData.slice(16, 28);
  const data = encryptedData.slice(28);

  const key = await deriveKey(passphraseWords.join(" "), salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    new Uint8Array(data)
  );
  return new Uint8Array(decrypted);
}

if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.onmessage = async (e: MessageEvent) => {
    const { id, type, data, passphraseWords } = e.data;
    try {
      let result: Uint8Array;
      if (type === 'encrypt') {
        result = await encryptData(data, passphraseWords);
      } else if (type === 'decrypt') {
        result = await decryptData(data, passphraseWords);
      } else {
        throw new Error(`Unknown type: ${type}`);
      }
      self.postMessage({ id, result }, { transfer: [result.buffer] } as any);
    } catch (error: any) {
      const errMsg = error.message || error.toString() || 'Worker Error';
      self.postMessage({ id, error: errMsg });
    }
  };
}
