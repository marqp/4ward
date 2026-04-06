<script lang="ts">
  import { decompressAndDetokenize } from '../core/compression';
  import { decryptData } from '../core/crypto';
  import { WORDLIST, PASSPHRASE_LENGTH } from '../core/wordlist';
  import { bytesToBase64 } from '../core/mnemonic';
  import QrTransmitter from './QrTransmitter.svelte';
  import QrScanner from './QrScanner.svelte';
  import MnemonicInput from './MnemonicInput.svelte';
  import PassphraseInput from './PassphraseInput.svelte';

  let {
    mode,           // 'send' | 'receive'
    payloadToSend,  // Uint8Array | null (send mode)
    sendPassphrase, // string[] (send mode)
    onReceived,     // (text: string) => void (receive mode)
    onClose
  } = $props<{
    mode: 'send' | 'receive';
    payloadToSend?: Uint8Array | null;
    sendPassphrase?: string[];
    onReceived?: (text: string) => void;
    onClose: () => void;
  }>();

  // ─── Send state ───
  let compactString = $derived.by(() => {
    if (mode === 'send' && payloadToSend) return bytesToBase64(payloadToSend);
    return '';
  });
  let copyStatus = $state('Copiar código');
  let copyErrorMsg = $state('');

  // ─── Receive state ───
  let receivePassphrase = $state<string[]>([]);
  let receiveReady = $derived(receivePassphrase.length === PASSPHRASE_LENGTH);
  let receiveMethod = $state<'scan' | 'code' | null>(null);
  let receiveError = $state('');
  let isProcessing = $state(false);
  let showPassphrase = $state(false);

  // ─── Send: copy ───
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(compactString);
      copyStatus = 'Copiado!';
      copyErrorMsg = '';
      setTimeout(() => copyStatus = 'Copiar código', 2000);
    } catch (err: any) {
      copyErrorMsg = 'Selecione o texto manualmente.';
      copyStatus = 'Falha ao copiar';
      setTimeout(() => { copyStatus = 'Copiar código'; copyErrorMsg = ''; }, 3000);
    }
  }

  // ─── Receive: passphrase ───
  function handlePassphraseComplete(words: string[]) {
    receivePassphrase = words;
  }

  // ─── Receive: decrypt ───
  async function handleData(data: Uint8Array) {
    receiveError = '';
    isProcessing = true;
    let decrypted: Uint8Array;
    let text: string;

    try {
      decrypted = await decryptData(data, receivePassphrase);
    } catch (err: any) {
      receiveError = 'Falha ao descriptografar. Verifique a chave de acesso.';
      isProcessing = false;
      return;
    }

    try {
      text = decompressAndDetokenize(decrypted);
    } catch (err: any) {
      receiveError = 'Falha de integridade. Os dados podem estar corrompidos.';
      isProcessing = false;
      return;
    }

    isProcessing = false;
    onReceived?.(text);
  }
</script>

<div class="fixed inset-0 z-40 flex items-center justify-center animate-fade-in bg-black/60 backdrop-blur-xl p-3 sm:p-6">
  <div class="bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative w-auto max-w-full h-full max-h-[92vh]">

    <button
      class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50 border border-white/10 shadow-lg"
      aria-label="Fechar"
      onclick={onClose}
    >
      <i class="bi bi-x-lg"></i>
    </button>

    {#if mode === 'send'}
      <!-- ═══════════════ SEND VIEW ═══════════════ -->
      <div class="flex flex-col lg:flex-row h-full overflow-hidden text-white w-full lg:min-w-[800px]">
        <div class="bg-black/30 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/10 h-full flex-1 min-w-[300px] min-h-0 relative">
          <!-- Background decoration -->
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none"></div>
          <div class="w-full h-full flex items-center justify-center p-6 md:p-10 z-10">
            <div class="w-full h-full flex items-center justify-center max-w-[500px] aspect-square">
              {#if payloadToSend}
                <QrTransmitter payload={payloadToSend} />
              {/if}
            </div>
          </div>
        </div>

        <div class="flex flex-col bg-white/5 h-full w-full lg:w-[400px] shrink-0">
          <div class="overflow-y-auto flex-grow p-6 md:p-8 custom-scrollbar">
            <h3 class="font-bold text-xl mb-8 flex items-center gap-3 text-white">
              <i class="bi bi-send-fill text-indigo-400"></i> Transferência
            </h3>

            <div class="mb-8 animate-slide-in" style="animation-delay: 0.1s;">
              <div class="flex items-center gap-3 mb-3">
                <div class="bg-indigo-500/20 border border-indigo-400/30 w-10 h-10 flex items-center justify-center rounded-xl text-indigo-300 shadow-inner"><i class="bi bi-qr-code text-lg"></i></div>
                <p class="font-bold m-0 text-indigo-300 uppercase tracking-widest text-xs">Escaneie o QR</p>
              </div>
              <p class="text-white/60 text-sm leading-relaxed mb-0 pl-1">Aponte a câmera do dispositivo receptor para o código animado ao lado.</p>
            </div>

            <div class="mb-6 animate-slide-in" style="animation-delay: 0.2s;">
              <div class="flex items-center gap-3 mb-3">
                <div class="bg-indigo-500/20 border border-indigo-400/30 w-10 h-10 flex items-center justify-center rounded-xl text-indigo-300 shadow-inner"><i class="bi bi-clipboard text-lg"></i></div>
                <p class="font-bold m-0 text-indigo-300 uppercase tracking-widest text-xs">Ou copie o código</p>
              </div>
              <p class="text-white/60 text-sm leading-relaxed mb-4 pl-1">Envie por e-mail, WhatsApp ou Invertexto. Seguro — só quem tem a chave de acesso pode ler.</p>

              <div class="bg-black/40 rounded-2xl p-4 mb-4 border border-white/10 shadow-inner relative group">
                <textarea readonly class="w-full bg-transparent border-0 p-0 text-xs text-white/50 font-mono resize-none focus:outline-none break-all" rows="3" value={compactString}></textarea>
              </div>

              <button class="w-full py-3.5 bg-indigo-500/80 hover:bg-indigo-500 text-white font-semibold shadow-lg rounded-2xl flex items-center justify-center gap-2 transition-all text-sm border border-indigo-400/30 backdrop-blur-sm" onclick={handleCopy}>
                <i class="bi {copyStatus.includes('Copiado') ? 'bi-check2-all' : copyStatus.includes('Falha') ? 'bi-exclamation-triangle' : 'bi-clipboard2-check'} text-lg"></i>
                {copyStatus}
              </button>
              {#if copyErrorMsg}<p class="text-rose-400 text-xs text-center mt-3 mb-0">{copyErrorMsg}</p>{/if}
            </div>
          </div>

          <!-- Footer passphrase -->
          <div class="p-6 border-t border-white/10 bg-black/30 shrink-0 backdrop-blur-md">
            <div class="flex justify-between items-center mb-3 px-1">
              <p class="font-bold text-xs text-rose-400 uppercase tracking-widest m-0 flex items-center">
                <i class="bi bi-shield-lock-fill mr-2"></i>Chave de Acesso
              </p>
              <button class="text-white/50 hover:text-white transition-colors p-1" aria-label={showPassphrase ? 'Ocultar chave' : 'Mostrar chave'} onclick={() => showPassphrase = !showPassphrase}>
                <i class="bi {showPassphrase ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-lg"></i>
              </button>
            </div>
            <div class="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 text-center flex items-center justify-center min-h-[64px] shadow-inner">
              <span class="font-mono uppercase font-bold text-rose-300 text-base leading-relaxed break-words transition-all" style="letter-spacing: {showPassphrase ? '2px' : '4px'}; opacity: {showPassphrase ? 1 : 0.8};">
                {showPassphrase ? (sendPassphrase ?? []).join(' ').toUpperCase() : '•••• •••• •••• •••• •••• ••••'}
              </span>
            </div>
          </div>
        </div>
      </div>

    {:else}
      <!-- ═══════════════ RECEIVE VIEW ═══════════════ -->
      <div class="flex flex-col h-full text-white w-[560px] max-w-full">
        {#if receiveMethod === 'scan'}
          <div class="p-6 md:p-8 flex-grow overflow-y-auto custom-scrollbar flex flex-col h-full relative">
            {#if isProcessing}
              <div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in m-6 md:m-8 rounded-3xl">
                <div class="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                <p class="text-white/80 font-medium">Descriptografando...</p>
              </div>
            {/if}
            <div class="mb-6 flex-grow min-h-[320px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative">
              <QrScanner onComplete={handleData} />
            </div>
            <button class="w-full py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl transition-colors flex items-center justify-center gap-2 font-medium shadow-lg backdrop-blur-md shrink-0" onclick={() => receiveMethod = null}>
              <i class="bi bi-arrow-left"></i>Voltar
            </button>
            {#if receiveError}
              <div class="bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-200 p-4 rounded-2xl mt-6 animate-fade-in flex items-center gap-3 shadow-lg">
                <i class="bi bi-exclamation-triangle-fill text-xl"></i>
                <span class="text-sm font-medium leading-relaxed">{receiveError}</span>
              </div>
            {/if}
          </div>

        {:else if receiveMethod === 'code'}
          <div class="p-6 md:p-8 flex-grow overflow-y-auto custom-scrollbar flex flex-col relative">
            {#if isProcessing}
              <div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in m-6 md:m-8 rounded-3xl">
                <div class="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                <p class="text-white/80 font-medium">Descriptografando...</p>
              </div>
            {/if}
            <MnemonicInput onComplete={handleData} />
            <button class="w-full py-4 mt-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl transition-colors flex items-center justify-center gap-2 font-medium shadow-lg backdrop-blur-md" onclick={() => receiveMethod = null}>
              <i class="bi bi-arrow-left"></i>Voltar
            </button>
            {#if receiveError}
              <div class="bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-200 p-4 rounded-2xl mt-6 animate-fade-in flex items-center gap-3 shadow-lg">
                <i class="bi bi-exclamation-triangle-fill text-xl"></i>
                <span class="text-sm font-medium leading-relaxed">{receiveError}</span>
              </div>
            {/if}
          </div>

        {:else}
          <!-- Passphrase + method selection -->
          <div class="p-6 md:p-8 flex-grow overflow-y-auto custom-scrollbar">
            
            <h3 class="font-bold text-xl mb-8 flex items-center gap-3 text-white">
              <i class="bi bi-download text-indigo-400"></i> Receber
            </h3>

            <!-- Step 1: Passphrase -->
            <div class="mb-8 bg-white/5 p-6 rounded-3xl border border-white/10">
              <div class="flex items-center gap-3 mb-4">
                <div class="bg-indigo-500/20 border border-indigo-400/30 w-10 h-10 flex items-center justify-center rounded-xl text-indigo-300">
                  <i class="bi bi-key-fill text-lg"></i>
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
                <button class="flex flex-col items-center justify-center w-full py-8 px-4 rounded-3xl border-2 transition-all {receiveReady ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white cursor-pointer shadow-lg hover:-translate-y-1' : 'bg-black/20 border-white/5 text-white/20 cursor-not-allowed'}" disabled={!receiveReady} onclick={() => { if (receiveReady) receiveMethod = 'scan'; }}>
                  <i class="bi bi-qr-code block mb-3 text-3xl"></i>
                  <span class="font-semibold text-sm mb-1">Escanear QR</span>
                  <span class="text-xs opacity-60">{receiveReady ? 'Apontar a câmera' : 'Aguardando chave'}</span>
                </button>
                
                <button class="flex flex-col items-center justify-center w-full py-8 px-4 rounded-3xl border-2 transition-all {receiveReady ? 'bg-white/5 border-white/20 hover:bg-white/10 text-white cursor-pointer shadow-lg hover:-translate-y-1' : 'bg-black/20 border-white/5 text-white/20 cursor-not-allowed'}" disabled={!receiveReady} onclick={() => { if (receiveReady) receiveMethod = 'code'; }}>
                  <i class="bi bi-clipboard block mb-3 text-3xl"></i>
                  <span class="font-semibold text-sm mb-1">Colar código</span>
                  <span class="text-xs opacity-60">{receiveReady ? 'Base64 criptografado' : 'Aguardando chave'}</span>
                </button>
              </div>
            </div>

            {#if receiveError}
              <div class="bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-200 p-4 rounded-2xl mt-6 animate-fade-in flex items-center gap-3 shadow-lg">
                <i class="bi bi-exclamation-triangle-fill text-xl"></i>
                <span class="text-sm font-medium leading-relaxed">{receiveError}</span>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  .animate-slide-in { opacity: 0; animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
  
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
</style>