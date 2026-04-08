<script lang="ts">
  import { IconBiExclamationTriangleFill } from '../icons';
  import EditorToolbar from './EditorToolbar.svelte';
  import EditorFABs from './EditorFABs.svelte';

  let {
    textToSend = $bindable(),
    error,
    isProcessing = false,
    onSend,
    onReceive,
    onCopy,
    onClear,
  } = $props<{
    textToSend: string;
    error: string;
    isProcessing?: boolean;
    onSend: () => void;
    onReceive: () => void;
    onCopy: () => void;
    onClear: () => void;
  }>();
</script>

<div class="flex flex-col flex-grow relative p-4 md:p-6 lg:max-w-5xl lg:mx-auto w-full">
  {#if textToSend}
    <EditorToolbar {onCopy} {onClear} />
  {/if}

  <textarea
    class="flex-grow text-base backdrop-blur-xl rounded-3xl p-6 md:p-8 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 resize-none shadow-2xl custom-scrollbar bg-white/5 border border-white/10"
    placeholder="Digite ou cole o texto aqui"
    bind:value={textToSend}
  ></textarea>

  {#if error}
    {@render errorMessage(error)}
  {/if}

  {@render footerDisclaimer()}
</div>

<EditorFABs {onSend} {onReceive} canSend={!!textToSend.trim()} {isProcessing} />

{#snippet errorMessage(msg: string)}
  <div role="alert" aria-live="assertive" class="mt-4 bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-200 rounded-2xl py-3 px-4 animate-fade-in flex items-center gap-3 shadow-lg">
    <IconBiExclamationTriangleFill class="text-lg inline-block" />{msg}
  </div>
{/snippet}

{#snippet footerDisclaimer()}
  <div class="mt-4 px-4 py-2 opacity-40 hover:opacity-80 transition-opacity">
    <p class="text-[10px] text-slate-400 text-center leading-relaxed italic m-0">
      A conferência da integridade e validade dos dados transmitidos é de responsabilidade exclusiva do usuário.
    </p>
  </div>
{/snippet}

<style>
  .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
</style>
