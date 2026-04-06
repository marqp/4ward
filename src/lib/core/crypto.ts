// src/lib/core/crypto.ts

import { encryptData as encryptLocal, decryptData as decryptLocal } from './crypto.worker';

let worker: Worker | null = null;
let messageId = 0;
const callbacks = new Map<number, { resolve: (val: Uint8Array) => void; reject: (err: any) => void }>();

function getWorker() {
  if (typeof window === 'undefined') {
      return null; // SSR / Node test fallback
  }
  if (!worker) {
    worker = new Worker(new URL('./crypto.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { id, result, error } = e.data;
      const cb = callbacks.get(id);
      if (cb) {
        callbacks.delete(id);
        if (error) cb.reject(new Error(error));
        else cb.resolve(result instanceof Uint8Array ? result : new Uint8Array(result));
      }
    };
    worker.onerror = (err) => {
      console.error('Worker error:', err);
      // Reject all pending callbacks on fatal worker error
      callbacks.forEach((cb) => cb.reject(new Error('Crypto worker failed to load or crashed')));
      callbacks.clear();
      worker = null;
    };
  }
  return worker;
}

export async function encryptData(data: Uint8Array, passphraseWords: string[]): Promise<Uint8Array> {
  const w = getWorker();
  if (!w) return encryptLocal(data, passphraseWords);

  return new Promise((resolve, reject) => {
    const id = messageId++;
    callbacks.set(id, { resolve, reject });
    const dataCopy = new Uint8Array(data);
    // Svelte 5 usa Proxies para estado ($state), que não podem ser clonados pelo postMessage
    const cleanPassphrase = [...passphraseWords];
    w.postMessage({ id, type: 'encrypt', data: dataCopy, passphraseWords: cleanPassphrase }, [dataCopy.buffer]);
  });
}

export async function decryptData(encryptedData: Uint8Array, passphraseWords: string[]): Promise<Uint8Array> {
  const w = getWorker();
  if (!w) return decryptLocal(encryptedData, passphraseWords);

  return new Promise((resolve, reject) => {
    const id = messageId++;
    callbacks.set(id, { resolve, reject });
    const dataCopy = new Uint8Array(encryptedData);
    const cleanPassphrase = [...passphraseWords];
    w.postMessage({ id, type: 'decrypt', data: dataCopy, passphraseWords: cleanPassphrase }, [dataCopy.buffer]);
  });
}
