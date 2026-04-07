<script lang="ts">
  import { IconBiClipboard2, IconBiTrash3 } from '../icons';

  let { onCopy, onClear } = $props<{
    onCopy: () => void;
    onClear: () => void;
  }>();
</script>

<div class="absolute right-8 top-8 z-10 flex gap-2">
  <button 
    class="text-emerald-400 hover:text-emerald-300 font-bold text-sm flex items-center gap-1.5 transition-colors bg-black/20 hover:bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-lg" 
    onclick={onCopy} 
    title="Copiar texto"
  >
    <IconBiClipboard2 class="text-xl inline-block" />Copiar
  </button>
  <button 
    class="text-rose-400 hover:text-rose-300 font-bold text-sm flex items-center gap-1.5 transition-colors bg-black/20 hover:bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-rose-500/20 shadow-lg" 
    onclick={onClear} 
    title="Limpar texto"
  >
    <IconBiTrash3 class="text-xl inline-block" />Limpar
  </button>
</div>
