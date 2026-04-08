// src/lib/core/crypto.ts

import { encryptData as encryptLocal, decryptData as decryptLocal } from './crypto.worker';
import type { WorkerRequest, WorkerResponse } from './crypto.types';

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
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
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

    const timeout = setTimeout(() => {
      if (callbacks.has(id)) {
        callbacks.delete(id);
        reject(new Error('Tempo limite excedido na criptografia. Seu dispositivo pode ser lento ou estar sem memória.'));
      }
    }, 30000);

    callbacks.set(id, { 
      resolve: (val) => { clearTimeout(timeout); resolve(val); }, 
      reject: (err) => { clearTimeout(timeout); reject(err); } 
    });

    const msg: WorkerRequest = { id, type: 'encrypt', data: text, passphraseWords: [...passphraseWords] };
    w.postMessage(msg);
  });
}

export async function decryptData(encryptedData: Uint8Array, passphraseWords: string[]): Promise<string> {
  const w = getWorker();
  if (!w) return decryptLocal(encryptedData, passphraseWords);

  return new Promise((resolve, reject) => {
    const id = messageId % 1_000_000;
    messageId = id + 1;

    const timeout = setTimeout(() => {
      if (callbacks.has(id)) {
        callbacks.delete(id);
        reject(new Error('Tempo limite excedido na descriptografia. Seu dispositivo pode ser lento ou estar sem memória.'));
      }
    }, 30000);

    callbacks.set(id, { 
      resolve: (val) => { clearTimeout(timeout); resolve(val); }, 
      reject: (err) => { clearTimeout(timeout); reject(err); } 
    });

    const dataCopy = new Uint8Array(encryptedData);
    const msg: WorkerRequest = { id, type: 'decrypt', data: dataCopy, passphraseWords: [...passphraseWords] };
    w.postMessage(msg, [dataCopy.buffer]);
  });
}
