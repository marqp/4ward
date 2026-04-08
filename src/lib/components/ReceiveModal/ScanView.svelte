<script lang="ts">
  import QrScanner from '../QrScanner.svelte';
  import { IconBiArrowLeft, IconBiExclamationTriangleFill } from '../icons';

  let {
    onData,
    onBack,
    error,
    isProcessing,
  } = $props<{
    onData: (data: Uint8Array) => void;
    onBack: () => void;
    error: string;
    isProcessing: boolean;
  }>();
</script>

<div class="p-6 md:p-8 flex-grow overflow-y-auto custom-scrollbar flex flex-col h-full relative">
  {#if isProcessing}
    <div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in m-6 md:m-8 rounded-3xl">
      <div class="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
      <p class="text-white/80 font-medium">Descriptografando...</p>
    </div>
  {/if}
  <div class="mb-6 flex-grow min-h-[320px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative">
    <QrScanner onComplete={onData} />
  </div>
  <button class="w-full py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl transition-colors flex items-center justify-center gap-2 font-medium shadow-lg backdrop-blur-md shrink-0" onclick={onBack}>
    <IconBiArrowLeft />Voltar
  </button>
  {#if error}
    <div role="alert" aria-live="assertive" class="bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-200 p-4 rounded-2xl mt-6 animate-fade-in flex items-center gap-3 shadow-lg">
      <IconBiExclamationTriangleFill class="text-xl" />
      <span class="text-sm font-medium leading-relaxed">{error}</span>
    </div>
  {/if}
</div>

<style>
  .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
</style>
