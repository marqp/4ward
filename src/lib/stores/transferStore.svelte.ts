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

class TransferStore {
  modalMode = $state<ModalMode>(null);
  activePayload = $state<Uint8Array | null>(null);
  activePassphrase = $state<string[]>([]);
  isProcessing = $state<boolean>(false);
  error = $state<string>('');

  openSend(payload: Uint8Array, passphrase: string[]): void {
    this.activePayload = payload;
    this.activePassphrase = passphrase;
    this.modalMode = 'send';
    this.error = '';
  }

  openReceive(): void {
    this.modalMode = 'receive';
    this.error = '';
  }

  closeModal(): void {
    wipeMemory(this.activePayload);
    wipeMemory(this.activePassphrase);
    this.activePayload = null;
    this.activePassphrase = [];
    this.modalMode = null;
    this.error = '';
  }

  setError(message: string): void {
    this.error = message;
  }

  clearError(): void {
    this.error = '';
  }

  setProcessing(value: boolean): void {
    this.isProcessing = value;
  }
}

export const transferStore = new TransferStore();
