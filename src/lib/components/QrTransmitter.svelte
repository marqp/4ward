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

<div class="d-flex justify-content-center align-items-center w-100 h-100">
  {#if qrDataUrl}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <img 
      src={qrDataUrl} 
      alt="Animated QR Code" 
      class="img-fluid rounded-4 shadow-sm" 
      style="max-width: 100%; max-height: 100%; object-fit: contain; cursor: zoom-in;" 
      onclick={() => isFullscreen = true}
    />
  {:else if errorMsg}
    <div class="alert alert-danger mx-3 text-center border-0 rounded-4 shadow-sm py-4">
      <i class="bi bi-exclamation-octagon fs-1 d-block mb-3"></i>
      <h4 class="h5 fw-bold">Falha Crítica</h4>
      <p class="mb-0 small">{errorMsg}</p>
      <button class="btn btn-outline-danger btn-sm mt-3" onclick={() => window.location.reload()}>Recarregar App</button>
    </div>
  {:else}
    <div class="d-flex flex-column align-items-center justify-content-center text-primary w-100 h-100">
      <div class="spinner-border mb-3" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Gerando QR...</span>
      </div>
      <span class="fw-medium text-secondary text-center px-4">Codificando payload seguro...</span>
    </div>
  {/if}
</div>

{#if isFullscreen && qrDataUrl}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center animate-fade-in p-3 p-md-5" 
    style="background-color: rgba(0, 0, 0, 0.9); backdrop-filter: blur(10px); z-index: 1050; cursor: zoom-out;"
    onclick={() => isFullscreen = false}
  >
    <img 
      src={qrDataUrl} 
      alt="Fullscreen Animated QR Code" 
      class="bg-white rounded-4 shadow-lg p-2 p-md-3" 
      style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; aspect-ratio: 1/1;" 
    />
  </div>
{/if}