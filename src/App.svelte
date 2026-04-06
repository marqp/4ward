<script lang="ts">
  import { loadText, saveText, clearText } from './lib/stores/textStore';
  import { transferStore } from './lib/stores/transferStore.svelte';
  import { compressAndEncrypt, copyToClipboard, decryptAndDecompress } from './lib/services/transferService';
  import Editor from './lib/components/Editor/Editor.svelte';
  import SendModal from './lib/components/SendModal.svelte';
  import ReceiveModal from './lib/components/ReceiveModal.svelte';

  // ─── Local UI state only ───
  let textToSend = $state(loadText());
  let error = $state('');

  // ─── Persistence ───
  $effect(() => { saveText(textToSend); });

  // ─── Actions (delegated to service) ───

  async function handleSend() {
    if (!textToSend.trim()) return;
    try {
      const { payload, passphrase, warning } = await compressAndEncrypt(textToSend);
      if (warning) error = warning;
      transferStore.openSend(payload, passphrase);
    } catch (err: any) {
      error = 'Falha ao encriptar: ' + (err.message || 'Erro desconhecido');
    }
  }

  async function handleReceived(text: string) {
    textToSend = text;
    transferStore.closeModal();
    await copyToClipboard(text);
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
    <div class="flex items-baseline gap-2">
      <h1 class="text-xl font-bold text-white m-0 tracking-tight">4ward</h1>
      <span class="text-white/70 text-sm font-medium">Transferência Segura</span>
    </div>
  </header>

  <!-- Editor -->
  <Editor
    bind:textToSend
    error={error}
    onSend={handleSend}
    onReceive={() => transferStore.openReceive()}
    onCopy={handleCopy}
    onClear={clearAll}
  />

  <!-- Modals (driven by store) -->
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
