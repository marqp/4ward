<script lang="ts">
  import { loadText, saveText, clearText } from './lib/stores/textStore';
  import { transferStore } from './lib/stores/transferStore.svelte';
  import { compressAndEncrypt, copyToClipboard } from './lib/services/transferService';
  import { estimatePayloadSize, validatePayloadSize } from './lib/services/transferService';
  import Editor from './lib/components/Editor/Editor.svelte';
  import SendModal from './lib/components/SendModal.svelte';
  import ReceiveModal from './lib/components/ReceiveModal.svelte';
  import WhyModal from './lib/components/WhyModal.svelte';

  // ─── Local UI state only ───
  let textToSend = $state(loadText());
  let sizeWarning = $state<string | null>(null);
  let error = $state('');
  let showWhyModal = $state(false);
  let isSending = $state(false);
  let skipSave = $state(false);

  // ─── Persistence ───
  $effect(() => {
    if (skipSave) { skipSave = false; return; }
    saveText(textToSend);
  });

  // ─── Reactive payload size warning (200ms cooldown) ───
  let sizeCheckTimer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    // Cancel previous timer
    if (sizeCheckTimer) { clearTimeout(sizeCheckTimer); sizeCheckTimer = null; }

    const text = textToSend.trim();
    if (!text) {
      sizeWarning = null;
      return;
    }

    sizeCheckTimer = setTimeout(() => {
      const estimatedSize = estimatePayloadSize(text);
      sizeWarning = validatePayloadSize(estimatedSize);
      sizeCheckTimer = null;
    }, 200);
  });

  // Error takes priority over sizeWarning
  let displayError = $derived(error || sizeWarning || '');

  // ─── Deep Linking (#porque) ───
  $effect(() => {
    if (window.location.hash === '#porque') {
      showWhyModal = true;
      // Limpa o hash para não reabrir se o usuário fechar e recarregar
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  });

  // ─── Actions (delegated to service) ───

  async function handleSend() {
    if (!textToSend.trim() || isSending) return;
    isSending = true;
    try {
      const { payload, passphrase, warning } = await compressAndEncrypt(textToSend);
      if (warning) error = warning;
      transferStore.openSend(payload, passphrase);
      // NÃO limpar aqui — a passphrase é a mesma referência do store.
      // A limpeza é feita pelo transferStore.closeModal() e onDestroy do SendPanel.
    } catch (err: any) {
      error = 'Falha ao encriptar: ' + (err.message || 'Erro desconhecido');
    } finally {
      isSending = false;
    }
  }

  async function handleReceived(text: string) {
    // Não salvar texto recebido no localStorage (dados sensíveis)
    skipSave = true;
    textToSend = text;
    transferStore.closeModal();
    const ok = await copyToClipboard(text);
    // Limpar o campo após copiar para não deixar rastro visível
    setTimeout(() => {
      textToSend = '';
      clearText();
    }, ok ? 2000 : 500);
  }

  async function handleCopy() {
    if (!textToSend) return;
    const ok = await copyToClipboard(textToSend);
    if (!ok) {
      error = 'Falha ao copiar automaticamente. Por favor, copie manualmente.';
      setTimeout(() => error = '', 3000);
    }
  }

  function clearAll() {
    clearText();
    textToSend = '';
    error = '';
  }
</script>

<main class="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100">
  <!-- Header -->
  <header class="bg-white/10 backdrop-blur-md border-b border-white/10 py-3 px-5 z-10 shadow-sm">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img src="/favicon.svg" alt="4ward logo" class="w-8 h-8 rounded-lg shadow-lg shadow-indigo-500/20" />
        <div class="flex items-baseline gap-2">
          <h1 class="text-xl font-bold text-white m-0 tracking-tight">4ward</h1>
          <span class="text-white/70 text-sm font-medium">Transferência Segura</span>
        </div>
      </div>
      
      <button 
        class="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
        onclick={() => showWhyModal = true}
      >
        Por quê?
      </button>
    </div>
  </header>

  <!-- Editor -->
  <Editor
    bind:textToSend
    error={displayError}
    onSend={handleSend}
    onReceive={() => transferStore.openReceive()}
    onCopy={handleCopy}
    onClear={clearAll}
  />

  <!-- Modals (driven by store) -->
  {#if showWhyModal}
    <WhyModal onClose={() => showWhyModal = false} />
  {/if}

  {#if transferStore.modalMode === 'send' && transferStore.activePayload}
    <SendModal
      payload={transferStore.activePayload}
      passphrase={transferStore.activePassphrase}
      onClose={() => transferStore.closeModal()}
    />
  {:else if transferStore.modalMode === 'receive'}
    <ReceiveModal
      onReceived={handleReceived}
      onClose={() => transferStore.closeModal()}
    />
  {/if}
</main>
