<script lang="ts">
  import { IconBiUpload, IconBiDownload } from '../icons';

  let { onSend, onReceive, canSend } = $props<{
    onSend: () => void;
    onReceive: () => void;
    canSend: boolean;
  }>();
</script>

<div class="fixed bottom-0 right-0 z-20 p-6 flex flex-col gap-3">
  <button
    class="h-14 px-6 rounded-2xl bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md border border-indigo-400/30 shadow-2xl transition-all flex items-center gap-2.5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 active:translate-y-0"
    onclick={onSend}
    disabled={!canSend}
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
