<script lang="ts">
  import QRCode from 'qrcode';
  import { FountainEncoder } from '../core/ur';

  let { payload } = $props<{ payload: Uint8Array }>();

  let qrDataUrl = $state('');
  let isFullscreen = $state(false);
  let errorMsg = $state('');
  let intervalId: ReturnType<typeof setInterval> | null = null;

  // Gerencia o loop de animação de forma reativa ao payload
  $effect(() => {
    if (!payload || payload.length === 0) {
      errorMsg = "Payload vazio ou inválido";
      return;
    }

    let encoder: FountainEncoder;
    try {
      // Usamos fragmentos de 800 bytes agora (otimizado com maiúsculas)
      encoder = new FountainEncoder(payload, 800);
    } catch (err: any) {
      console.error("Erro ao instanciar FountainEncoder:", err);
      errorMsg = "Erro no codificador: " + err.message;
      return;
    }

    const isStatic = encoder.isSinglePart();
    
    // Limpa intervalo anterior se existir
    if (intervalId) clearInterval(intervalId);

    async function updateFrame() {
      try {
        const part = encoder.nextPart();
        const url = await QRCode.toDataURL(part, {
          errorCorrectionLevel: 'L',
          margin: 2,
          width: 1000,
        });
        qrDataUrl = url;
        errorMsg = '';
      } catch (err: any) {
        console.error("Erro ao gerar frame do QR:", err);
        errorMsg = "Erro ao gerar QR: " + err.message;
      }
    }

    // Primeiro frame imediato
    updateFrame();
    
    // Só inicia o loop se houver mais de uma parte (Fountain mode)
    if (!isStatic) {
      intervalId = setInterval(updateFrame, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isFullscreen) {
      isFullscreen = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex justify-center items-center w-full h-full">
  {#if qrDataUrl}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <img 
      src={qrDataUrl} 
      alt="Animated QR Code" 
      class="max-w-full max-h-full object-contain cursor-zoom-in rounded-3xl shadow-2xl bg-white p-3 md:p-4 border border-white/20" 
      onclick={() => isFullscreen = true}
    />
  {:else if errorMsg}
    <div class="bg-rose-500/20 backdrop-blur-xl border border-rose-500/30 mx-4 text-center rounded-3xl shadow-2xl py-8 px-6 text-white w-full max-w-sm">
      <i class="bi bi-exclamation-octagon text-5xl block mb-4 text-rose-400"></i>
      <h4 class="text-lg font-bold mb-2">Falha Crítica</h4>
      <p class="mb-0 text-sm text-rose-200">{errorMsg}</p>
      <button class="mt-6 px-5 py-2.5 border border-rose-400/50 hover:bg-rose-500/30 text-rose-100 rounded-xl transition-colors text-sm font-medium shadow-lg" onclick={() => window.location.reload()}>Recarregar App</button>
    </div>
  {:else}
    <div class="flex flex-col items-center justify-center text-indigo-300 w-full h-full gap-5">
      <div class="w-12 h-12 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></div>
      <span class="font-medium text-white/70 text-center px-4 tracking-wide">Codificando payload seguro...</span>
    </div>
  {/if}
</div>

{#if isFullscreen && qrDataUrl}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="fixed inset-0 flex items-center justify-center p-4 md:p-12 z-[60] cursor-zoom-out bg-black/80 backdrop-blur-2xl" 
    onclick={() => isFullscreen = false}
  >
    <img 
      src={qrDataUrl} 
      alt="Fullscreen Animated QR Code" 
      class="bg-white rounded-[2rem] shadow-2xl p-4 md:p-8 max-w-full max-h-full object-contain aspect-square animate-zoom-in" 
    />
  </div>
{/if}

<style>
  .animate-zoom-in {
    animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes zoomIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
</style>