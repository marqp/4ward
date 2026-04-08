import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { transferStore } from '../src/lib/stores/transferStore.svelte.ts';

describe('TransferStore state transitions', () => {
  beforeEach(() => {
    // Usa timers fake para testar o auto-clear de erros (5000ms) sem lentidão
    vi.useFakeTimers();
    transferStore.closeModal(); // Garante estado limpo antes de cada teste
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('initial state is correct', () => {
    expect(transferStore.modalMode).toBeNull();
    expect(transferStore.activePayload).toBeNull();
    expect(transferStore.activePassphrase).toEqual([]);
    expect(transferStore.isProcessing).toBe(false);
    expect(transferStore.error).toBe('');
  });

  test('openSend sets correct state', () => {
    const payload = new Uint8Array([1, 2, 3]);
    const passphrase = ['test', 'word'];

    transferStore.openSend(payload, passphrase);

    expect(transferStore.modalMode).toBe('send');
    expect(transferStore.activePayload).toBe(payload);
    expect(transferStore.activePassphrase).toBe(passphrase);
    expect(transferStore.error).toBe('');
  });

  test('openReceive sets correct state', () => {
    // Se havia um erro antes, abrir receive deve limpar
    transferStore.setError('Old error');
    transferStore.openReceive();

    expect(transferStore.modalMode).toBe('receive');
    expect(transferStore.error).toBe('');
  });

  test('closeModal wipes references and resets state', () => {
    const payload = new Uint8Array([1, 2, 3]);
    const passphrase = ['secret', 'key'];

    transferStore.openSend(payload, passphrase);
    transferStore.closeModal();

    expect(transferStore.modalMode).toBeNull();
    expect(transferStore.activePayload).toBeNull();
    expect(transferStore.activePassphrase).toEqual([]);
    expect(transferStore.error).toBe('');
  });

  test('setError auto-clears after 5000ms', () => {
    transferStore.setError('Test error');
    expect(transferStore.error).toBe('Test error');

    // Avança 4999ms - o erro ainda deve estar lá
    vi.advanceTimersByTime(4999);
    expect(transferStore.error).toBe('Test error');

    // Avança mais 1ms para fechar os 5000ms - o erro deve ser limpo
    vi.advanceTimersByTime(1);
    expect(transferStore.error).toBe('');
  });

  test('clearError manually clears the error and timer', () => {
    transferStore.setError('Test error');
    expect(transferStore.error).toBe('Test error');

    transferStore.clearError();
    expect(transferStore.error).toBe('');

    // Avança no tempo para verificar se não há callback fantasma
    vi.advanceTimersByTime(5000); 
    expect(transferStore.error).toBe('');
  });

  test('setProcessing updates state correctly', () => {
    transferStore.setProcessing(true);
    expect(transferStore.isProcessing).toBe(true);

    transferStore.setProcessing(false);
    expect(transferStore.isProcessing).toBe(false);
  });
});