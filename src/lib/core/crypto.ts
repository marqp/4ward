// src/lib/core/crypto.ts

import { encryptData as encryptLocal, decryptData as decryptLocal } from './crypto.worker';

let worker: Worker | null = null;
let messageId = 0;
const callbacks = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

function isWorkerAvailable(): boolean {
  return typeof Worker !== 'undefined' && typeof window !== 'undefined';
}

function getWorker(): Worker | null {
  if (!isWorkerAvailable()) return null;

  if (!worker) {
    worker = new Worker(new URL('./crypto.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { id, result, error } = e.data;
      const cb = callbacks.get(id);
      if (cb) {
        callbacks.delete(id);
        if (error) cb.reject(new Error(error));
        else cb.resolve(result);
      }
    };
    worker.onerror = (err) => {
      console.error('Worker error:', err);
      callbacks.forEach((cb) => cb.reject(new Error('Crypto worker failed to load or crashed')));
      callbacks.clear();
      worker = null;
    };
  }
  return worker;
}

export async function encryptData(text: string, passphraseWords: string[]): Promise<Uint8Array> {
  const w = getWorker();
  if (!w) return encryptLocal(text, passphraseWords);

  return new Promise((resolve, reject) => {
    const id = messageId % 1_000_000;
    messageId = id + 1;
    callbacks.set(id, { resolve, reject });
    w.postMessage({ id, type: 'encrypt', data: text, passphraseWords: [...passphraseWords] });
  });
}

export async function decryptData(encryptedData: Uint8Array, passphraseWords: string[]): Promise<string> {
  const w = getWorker();
  if (!w) return decryptLocal(encryptedData, passphraseWords);

  return new Promise((resolve, reject) => {
    const id = messageId % 1_000_000;
    messageId = id + 1;
    callbacks.set(id, { resolve, reject });
    const dataCopy = new Uint8Array(encryptedData);
    w.postMessage({ id, type: 'decrypt', data: dataCopy, passphraseWords: [...passphraseWords] }, [dataCopy.buffer]);
  });
}
