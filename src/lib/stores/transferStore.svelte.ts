/**
 * Transfer store — manages the state for send/receive modals.
 *
 * Uses a class with $state properties so that reactivity propagates
 * across component boundaries when the singleton is imported.
 *
 * Usage in Svelte components:
 *   import { transferStore } from '$lib/stores/transferStore';
 *   $effect(() => { console.log(transferStore.modalMode); });
 */

import { wipeMemory } from '../utils/memory';

export type ModalMode = 'send' | 'receive' | null;

const ERROR_AUTO_CLEAR_MS = 5000;

class TransferStore {
  modalMode = $state<ModalMode>(null);
  activePayload = $state<Uint8Array | null>(null);
  activePassphrase = $state<string[]>([]);
  isProcessing = $state<boolean>(false);
  error = $state<string>('');
  #errorTimer: ReturnType<typeof setTimeout> | null = null;

  openSend(payload: Uint8Array, passphrase: string[]): void {
    this.activePayload = payload;
    this.activePassphrase = passphrase;
    this.modalMode = 'send';
    this.error = '';
    this.#clearErrorTimer();
  }

  openReceive(): void {
    this.modalMode = 'receive';
    this.error = '';
    this.#clearErrorTimer();
  }

  closeModal(): void {
    wipeMemory(this.activePayload);
    wipeMemory(this.activePassphrase);
    this.activePayload = null;
    this.activePassphrase = [];
    this.modalMode = null;
    this.error = '';
    this.#clearErrorTimer();
  }

  setError(message: string): void {
    this.error = message;
    this.#clearErrorTimer();
    this.#errorTimer = setTimeout(() => {
      this.error = '';
    }, ERROR_AUTO_CLEAR_MS);
  }

  clearError(): void {
    this.error = '';
    this.#clearErrorTimer();
  }

  setProcessing(value: boolean): void {
    this.isProcessing = value;
  }

  #clearErrorTimer(): void {
    if (this.#errorTimer) {
      clearTimeout(this.#errorTimer);
      this.#errorTimer = null;
    }
  }
}

export const transferStore = new TransferStore();
