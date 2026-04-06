<script lang="ts">
  import QrDisplay from './SendModal/QrDisplay.svelte';
  import SendPanel from './SendModal/SendPanel.svelte';
  import { IconBiXLg } from './icons';

  let {
    payload,
    passphrase,
    onClose,
  } = $props<{
    payload: Uint8Array;
    passphrase: string[];
    onClose: () => void;
  }>();

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

    <div class="flex flex-col lg:flex-row h-full overflow-hidden text-white w-full lg:min-w-[800px]">
      <!-- QR Area -->
      <div class="bg-black/30 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/10 h-full flex-1 min-w-[300px] min-h-0 relative">
        <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none"></div>
        <div class="w-full h-full flex items-center justify-center p-6 md:p-10 z-10">
          <div class="w-full h-full flex items-center justify-center max-w-[500px] aspect-square">
            <QrDisplay {payload} />
          </div>
        </div>
      </div>

      <!-- Side Panel -->
      <SendPanel {payload} {passphrase} />
    </div>
  </div>
</div>

<style>
  .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  .animate-scale-up { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleUp { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
</style>
