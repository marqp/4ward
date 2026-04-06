<script lang="ts">
  import { compressAndTokenize } from './lib/core/compression';
  import { encryptData } from './lib/core/crypto';
  import { WORDLIST, PASSPHRASE_LENGTH } from './lib/core/wordlist';
  import TransferModal from './lib/components/TransferModal.svelte';

  // State
  let textToSend = $state(loadText());
  let isProcessing = $state(false);
  let error = $state('');

  // Modal state
  let modalMode = $state<'send' | 'receive' | null>(null);
  let activePayload = $state<Uint8Array | null>(null);
  let activePassphrase = $state<string[]>([]);
  
  // Animation state
  let blinkState = $state<'white' | 'green' | 'red' | null>(null);

  function triggerBlink(color: 'white' | 'green' | 'red') {
    blinkState = color;
    setTimeout(() => { blinkState = null; }, 300);
  }

  function loadText(): string {
    try { return localStorage.getItem('4ward_text') ?? ''; } catch { return ''; }
  }

  $effect(() => {
    try { localStorage.setItem('4ward_text', textToSend); } catch {}
  });

  function generatePassphrase(): string[] {
    const words: string[] = [];
    const array = new Uint32Array(PASSPHRASE_LENGTH);
    crypto.getRandomValues(array);
    for (let i = 0; i < PASSPHRASE_LENGTH; i++) {
      words.push(WORDLIST[array[i] % WORDLIST.length]);
    }
    return words;
  }

  async function handleSend() {
    if (!textToSend.trim()) return;
    isProcessing = true;
    error = '';
    try {
      await new Promise(r => setTimeout(r, 50));
      const passphrase = generatePassphrase();
      const compressed = compressAndTokenize(textToSend);

      if (compressed.length > 10240) {
        error = 'Aviso: O texto é muito longo (>10KB após compressão). A transmissão pode ser lenta.';
      }

      const payload = await encryptData(compressed, passphrase);
      activePayload = payload;
      activePassphrase = passphrase;
      modalMode = 'send';
    } catch (err: any) {
      error = 'Falha ao encriptar: ' + (err.message || 'Erro desconhecido');
    } finally {
      isProcessing = false;
    }
  }

  async function handleReceived(text: string) {
    textToSend = text;
    modalMode = null;
    triggerBlink('green');
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }

  async function handleCopy() {
    if (!textToSend) return;
    try {
      await navigator.clipboard.writeText(textToSend);
      triggerBlink('green');
    } catch {}
  }

  function clearText() {
    triggerBlink('red');
    textToSend = '';
    error = '';
    try { localStorage.removeItem('4ward_text'); } catch {}
  }
</script>

<main class="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100">
  <!-- Header minimalista -->
  <header class="bg-white/10 backdrop-blur-md border-b border-white/10 py-3 px-5 z-10 shadow-sm">
    <div class="flex items-baseline gap-2">
      <h1 class="text-xl font-bold text-white m-0 tracking-tight">4ward</h1>
      <span class="text-white/70 text-sm font-medium">Transferência Segura</span>
    </div>
  </header>

  <!-- Textarea -->
  <div class="flex flex-col flex-grow relative p-4 md:p-6 lg:max-w-5xl lg:mx-auto w-full">
    {#if textToSend}
      <div class="absolute right-8 top-8 z-10 flex gap-2">
        <button class="text-emerald-400 hover:text-emerald-300 font-bold text-sm flex items-center gap-1.5 transition-colors bg-black/20 hover:bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-lg" onclick={handleCopy} title="Copiar texto">
          <i class="bi bi-clipboard2"></i>Copiar
        </button>
        <button class="text-rose-400 hover:text-rose-300 font-bold text-sm flex items-center gap-1.5 transition-colors bg-black/20 hover:bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-rose-500/20 shadow-lg" onclick={clearText} title="Limpar texto">
          <i class="bi bi-trash3"></i>Limpar
        </button>
      </div>
    {/if}

    <textarea
      class="flex-grow text-base backdrop-blur-xl rounded-3xl p-6 md:p-8 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 resize-none shadow-2xl custom-scrollbar {
        blinkState === 'white' ? 'ring-4 ring-white/80 bg-white/20 border-white/40' :
        blinkState === 'green' ? 'ring-4 ring-emerald-500/80 bg-emerald-500/20 border-emerald-400/40' :
        blinkState === 'red' ? 'ring-4 ring-rose-500/80 bg-rose-500/20 border-rose-400/40' :
        'bg-white/5 border-white/10'
      } border"
      placeholder="Digite ou cole o texto aqui"
      bind:value={textToSend}
      disabled={isProcessing}
    ></textarea>

    {#if error}
      <div class="mt-4 bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-200 rounded-2xl py-3 px-4 animate-fade-in flex items-center gap-3 shadow-lg">
        <i class="bi bi-exclamation-triangle-fill text-lg"></i>{error}
      </div>
    {/if}
  </div>

  <!-- FABs empilhados -->
  <div class="fixed bottom-0 right-0 z-20 p-6 flex flex-col gap-3">
    <!-- Enviar -->
    <button
      class="h-14 px-6 rounded-2xl bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md border border-indigo-400/30 shadow-2xl transition-all flex items-center gap-2.5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 active:translate-y-0"
      onclick={handleSend}
      disabled={!textToSend.trim() || isProcessing}
      title="Enviar texto"
    >
      <i class="bi bi-upload text-xl"></i>
      <span class="font-semibold text-sm tracking-wide">Enviar</span>
    </button>

    <!-- Receber -->
    <button
      class="h-14 px-6 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 shadow-2xl transition-all flex items-center gap-2.5 text-white hover:-translate-y-1 active:translate-y-0"
      onclick={() => { modalMode = 'receive'; }}
      title="Receber texto"
    >
      <i class="bi bi-download text-xl"></i>
      <span class="font-semibold text-sm tracking-wide">Receber</span>
    </button>
  </div>
</main>

<!-- Modal unificado -->
{#if modalMode === 'send'}
  <TransferModal
    mode="send"
    payloadToSend={activePayload}
    sendPassphrase={activePassphrase}
    onClose={() => { modalMode = null; activePayload = null; }}
  />
{:else if modalMode === 'receive'}
  <TransferModal
    mode="receive"
    onReceived={handleReceived}
    onClose={() => { modalMode = null; }}
  />
{/if}

<style>
  .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
</style>
