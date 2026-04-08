/**
 * Types for Web Worker communication in the crypto module.
 * Uses discriminated unions for type-safe messaging.
 */

export type CryptoAction = 'encrypt' | 'decrypt';

export interface EncryptRequest {
  id: number;
  type: 'encrypt';
  data: string;
  passphraseWords: string[];
}

export interface DecryptRequest {
  id: number;
  type: 'decrypt';
  data: Uint8Array;
  passphraseWords: string[];
}

export type WorkerRequest = EncryptRequest | DecryptRequest;

export interface EncryptResponse {
  id: number;
  result: Uint8Array;
  error?: never;
}

export interface DecryptResponse {
  id: number;
  result: string;
  error?: never;
}

export interface ErrorResponse {
  id: number;
  result?: never;
  error: string;
}

export type WorkerResponse = EncryptResponse | DecryptResponse | ErrorResponse;
