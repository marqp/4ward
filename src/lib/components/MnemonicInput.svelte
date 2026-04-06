<script lang="ts">
  import { base64ToBytes } from '../core/mnemonic';

  let { onComplete } = $props<{ onComplete: (data: Uint8Array) => void }>();

  let bulkText = $state('');
  let errorMsg = $state('');
  let isProcessing = $state(false);

  async function handleProcess() {
    if (!bulkText.trim() || isProcessing) return;

    isProcessing = true;
    errorMsg = '';
    try {
      // Remove all whitespaces and newlines to prevent failing due to copy/paste artifacts
      const cleanText = bulkText.replace(/[\s\r\n]+/g, '');
      if (/^[A-Za-z0-9+/=]+$/.test(cleanText)) {
        const data = base64ToBytes(cleanText);
        onComplete(data);
      } else {
        errorMsg = "O conteúdo colado não parece ser um código válido do 4ward.";
      }
    } catch (err: any) {
      errorMsg = "Erro ao processar: verifique se copiou o código completo.";
      console.error(err);
    } finally {
      isProcessing = false;
    }
  }
</script>

<div class="animate-fade-in">
  <div class="relative">
    <textarea
      class="w-full bg-white/5 backdrop-blur-xl border border-white/20 text-white placeholder-white/40 p-4 font-mono shadow-inner rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none text-xs leading-relaxed break-all custom-scrollbar"
      rows="6"
      placeholder="Cole o código Base64 aqui..."
      bind:value={bulkText}
      oninput={() => errorMsg = ''}
    ></textarea>
  </div>

  {#if errorMsg}
    <div class="bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-200 py-2.5 px-4 text-sm rounded-xl mt-3 mb-3 animate-fade-in flex items-center gap-2 shadow-lg">
      <i class="bi bi-exclamation-circle-fill"></i>{errorMsg}
    </div>
  {/if}

  <button
    class="w-full py-3.5 bg-indigo-500/80 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl shadow-lg flex items-center justify-center gap-2 mt-4 transition-colors border border-indigo-400/30 backdrop-blur-sm"
    disabled={!bulkText.trim() || isProcessing}
    onclick={handleProcess}
  >
    {#if isProcessing}
      <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      Processando...
    {:else}
      <i class="bi bi-unlock-fill"></i>
      Descriptografar
    {/if}
  </button>
</div>

<style>
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>