<script lang="ts">
  import { IconBiClipboard2, IconBiTrash3, IconBiUpload, IconBiDownload, IconBiExclamationTriangleFill } from '../icons';

  let {
    textToSend = $bindable(),
    error,
    onSend,
    onReceive,
    onCopy,
    onClear,
  } = $props<{
    textToSend: string;
    error: string;
    onSend: () => void;
    onReceive: () => void;
    onCopy: () => void;
    onClear: () => void;
  }>();
</script>

<div class="flex flex-col flex-grow relative p-4 md:p-6 lg:max-w-5xl lg:mx-auto w-full">
  <!-- Toolbar -->
  {#if textToSend}
    <div class="absolute right-8 top-8 z-10 flex gap-2">
      <button class="text-emerald-400 hover:text-emerald-300 font-bold text-sm flex items-center gap-1.5 transition-colors bg-black/20 hover:bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-lg" onclick={onCopy} title="Copiar texto">
        <IconBiClipboard2 class="text-xl inline-block" />Copiar
      </button>
      <button class="text-rose-400 hover:text-rose-300 font-bold text-sm flex items-center gap-1.5 transition-colors bg-black/20 hover:bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-rose-500/20 shadow-lg" onclick={onClear} title="Limpar texto">
        <IconBiTrash3 class="text-xl inline-block" />Limpar
      </button>
    </div>
  {/if}

  <!-- Textarea -->
  <textarea
    class="flex-grow text-base backdrop-blur-xl rounded-3xl p-6 md:p-8 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 resize-none shadow-2xl custom-scrollbar bg-white/5 border border-white/10"
    placeholder="Digite ou cole o texto aqui"
    bind:value={textToSend}
  ></textarea>

  <!-- Error -->
  {#if error}
    <div class="mt-4 bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-200 rounded-2xl py-3 px-4 animate-fade-in flex items-center gap-3 shadow-lg">
      <IconBiExclamationTriangleFill class="text-lg inline-block" />{error}
    </div>
  {/if}
</div>

<!-- FABs -->
<div class="fixed bottom-0 right-0 z-20 p-6 flex flex-col gap-3">
  <button
    class="h-14 px-6 rounded-2xl bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md border border-indigo-400/30 shadow-2xl transition-all flex items-center gap-2.5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 active:translate-y-0"
    onclick={onSend}
    disabled={!textToSend.trim()}
    title="Enviar texto"
  >
    <IconBiUpload class="text-xl" />
    <span class="font-semibold text-sm tracking-wide">Enviar</span>
  </button>

  <button
    class="h-14 px-6 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 shadow-2xl transition-all flex items-center gap-2.5 text-white hover:-translate-y-1 active:translate-y-0"
    onclick={onReceive}
    title="Receber texto"
  >
    <IconBiDownload class="text-xl" />
    <span class="font-semibold text-sm tracking-wide">Receber</span>
  </button>
</div>

<style>
  .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
</style>
