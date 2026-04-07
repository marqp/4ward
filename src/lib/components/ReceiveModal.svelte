<script lang="ts">
  import { decryptData } from '../core/crypto';
  import { PASSPHRASE_LENGTH } from '../core/wordlist';
  import { wipeMemory } from '../utils/memory';
  import PassphraseInput from './PassphraseInput.svelte';
  import ScanView from './ReceiveModal/ScanView.svelte';
  import CodeView from './ReceiveModal/CodeView.svelte';
  import {
    IconBiXLg,
    IconBiDownload,
    IconBiKeyFill,
    IconBiQrCode,
    IconBiClipboard,
    IconBiExclamationTriangleFill,
  } from './icons';

  let {
    onReceived,
    onClose,
  } = $props<{
    onReceived: (text: string) => void;
    onClose: () => void;
  }>();

  // ─── State ───

  let receivePassphrase = $state<string[]>([]);
  let receiveReady = $derived(receivePassphrase.length === PASSPHRASE_LENGTH);
  let receiveMethod = $state<'scan' | 'code' | null>(null);
  let receiveError = $state('');
  let isProcessing = $state(false);

  // ─── Passphrase input ───

  function handlePassphraseComplete(words: string[]) {
    receivePassphrase = words;
  }

  // ─── Decrypt ───

  async function handleData(data: Uint8Array) {
    receiveError = '';
    isProcessing = true;

    let text: string;
    try {
      // decryptData já descomprime internamente (compression embutida no worker)
      text = await decryptData(data, receivePassphrase);
    } catch {
      receiveError = 'Falha ao descriptografar. Verifique a chave de acesso.';
      isProcessing = false;
      return;
    }

    // Limpa passphrase da memória após uso
    wipeMemory(receivePassphrase);
    receivePassphrase = [];

    isProcessing = false;
    onReceived(text);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="fixed inset-0 z-40 flex items-center justify-center animate-fade-in p-3 sm:p-6">
  <!-- Backdrop -->
  <button 
    class="absolute inset-0 bg-black/60 backdrop-blur-xl border-none w-full h-full cursor-default" 
    onclick={onClose}
    aria-label="Fechar modal"
  ></button>

  <div class="bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative w-auto max-w-full h-full max-h-[92vh] animate-scale-up">

    <button
      class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 border border-white/10 shadow-lg"
      aria-label="Fechar"
      onclick={onClose}
    >
      <IconBiXLg />
    </button>

    <div class="flex flex-col h-full text-white w-[800px] max-w-full relative">
      {#if receiveMethod === 'scan'}
        <ScanView
          onData={handleData}
          onBack={() => receiveMethod = null}
          error={receiveError}
          isProcessing={isProcessing}
        />

      {:else if receiveMethod === 'code'}
        <CodeView
          onData={handleData}
          onBack={() => receiveMethod = null}
          error={receiveError}
          isProcessing={isProcessing}
        />

      {:else}
        <!-- ─── Passphrase + Method Selection ─── -->
        <div class="p-6 md:p-8 flex-grow overflow-y-auto custom-scrollbar">

          <h3 class="font-bold text-xl mb-8 flex items-center gap-3 text-white">
            <IconBiDownload class="text-indigo-400" /> Receber
          </h3>

          <!-- Step 1: Passphrase -->
          <div class="mb-8 bg-white/5 p-6 rounded-3xl border border-white/10">
            <div class="flex items-center gap-3 mb-4">
              <div class="bg-indigo-500/20 border border-indigo-400/30 w-10 h-10 flex items-center justify-center rounded-xl text-indigo-300">
                <IconBiKeyFill class="text-lg" />
              </div>
              <p class="font-bold m-0 text-indigo-300 uppercase tracking-widest text-xs">1. Digite a chave</p>
            </div>
            <p class="text-white/50 text-sm leading-relaxed mb-5 pl-1">{PASSPHRASE_LENGTH} palavras · Ou cole todas de uma vez</p>
            <PassphraseInput onComplete={handlePassphraseComplete} />
          </div>

          <!-- Step 2: Method selection -->
          {#if receiveReady}
            <div class="text-center mb-6 animate-fade-in">
              <span class="inline-block bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-sm py-2 px-5 rounded-full font-mono shadow-inner">
                {receivePassphrase.join(' ')}
              </span>
            </div>
          {/if}

          <div class="mb-4">
            <div class="flex items-center gap-3 mb-5 pl-2">
              <p class="font-bold m-0 text-white/70 uppercase tracking-widest text-xs">2. Escolha o método</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <button
                class="flex flex-col items-center justify-center w-full py-8 px-4 rounded-3xl border-2 transition-all {receiveReady ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white cursor-pointer shadow-lg hover:-translate-y-1' : 'bg-black/20 border-white/5 text-white/20 cursor-not-allowed'}"
                disabled={!receiveReady}
                onclick={() => { if (receiveReady) receiveMethod = 'scan'; }}
              >
                <IconBiQrCode class="block mb-3 text-3xl" />
                <span class="font-semibold text-sm mb-1">Escanear QR</span>
                <span class="text-xs opacity-60">{receiveReady ? 'Apontar a câmera' : 'Aguardando chave'}</span>
              </button>

              <button
                class="flex flex-col items-center justify-center w-full py-8 px-4 rounded-3xl border-2 transition-all {receiveReady ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white cursor-pointer shadow-lg hover:-translate-y-1' : 'bg-black/20 border-white/5 text-white/20 cursor-not-allowed'}"
                disabled={!receiveReady}
                onclick={() => { if (receiveReady) receiveMethod = 'code'; }}
              >
                <IconBiClipboard class="block mb-3 text-3xl" />
                <span class="font-semibold text-sm mb-1">Colar código</span>
                <span class="text-xs opacity-60">{receiveReady ? 'Base64 criptografado' : 'Aguardando chave'}</span>
              </button>
            </div>
          </div>

          {#if receiveError}
            <div class="bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-200 p-4 rounded-2xl mt-6 animate-fade-in flex items-center gap-3 shadow-lg">
              <IconBiExclamationTriangleFill class="text-xl" />
              <span class="text-sm font-medium leading-relaxed">{receiveError}</span>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  .animate-scale-up { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleUp { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
</style>
