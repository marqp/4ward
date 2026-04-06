<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { FountainDecoder } from '../core/ur';

  let { onComplete } = $props<{ onComplete: (data: Uint8Array) => void }>();

  let scannerId = "reader-" + Math.random().toString(36).substring(2, 9);
  let scanner: any = null;
  let ScannerClass: any = null;
  let decoder = $state(new FountainDecoder());
  let progress = $state(0);
  let errorMsg = $state('');
  let canSwitchCamera = $state(false);
  let loadingScanner = $state(true);

  onMount(async () => {
    // Lazy load — so carrega o scanner quando o componente monta
    const { Scanner } = await import('../core/scanner');
    ScannerClass = Scanner;
    loadingScanner = false;
    startScanner();
  });

  function startScanner() {
    if (!ScannerClass) return;
    scanner = new ScannerClass(scannerId);
    scanner.start((decodedText: string) => {
      try {
        if (decoder.receivePart(decodedText)) {
          const result = decoder.getResult();
          if (result) {
            stopScanner();
            onComplete(result);
          }
        } else {
          progress = Math.round(decoder.getEstimatedPercent() * 100);
        }
      } catch (err: any) {
        errorMsg = decoder.getError() || err.message;
      }
    }, () => {
      // frames vazios ignorados
    }).then(() => {
      canSwitchCamera = scanner?.hasMultipleCameras() || false;
    });
  }

  async function handleSwitchCamera() {
    if (scanner) {
      try {
        await scanner.switchCamera();
      } catch (err: any) {
        errorMsg = "Erro ao trocar câmera: " + err.message;
      }
    }
  }

  async function stopScanner() {
    if (scanner) {
      await scanner.stop();
      scanner = null;
    }
  }

  onDestroy(() => {
    stopScanner();
  });
</script>

<div class="card shadow-none border-0 bg-transparent">
  <div class="card-body p-0 bg-dark rounded-top-4 overflow-hidden position-relative shadow-sm">
    {#if loadingScanner}
      <div class="d-flex align-items-center justify-content-center py-5">
        <div class="spinner-border text-light" role="status">
          <span class="visually-hidden">Carregando scanner...</span>
        </div>
      </div>
    {:else}
      <div id={scannerId} style="width: 100%; margin: 0 auto; min-height: 250px;"></div>
    {/if}
    
    {#if canSwitchCamera}
      <button 
        class="btn btn-dark btn-sm position-absolute bottom-0 end-0 m-3 rounded-pill px-3 py-2 z-3 shadow-lg border border-secondary border-opacity-50 d-flex align-items-center gap-2"
        onclick={handleSwitchCamera}
        style="background-color: rgba(0,0,0,0.7); backdrop-filter: blur(4px);"
      >
        <i class="bi bi-camera-rotate fs-6"></i>
        <span class="small fw-bold text-uppercase">Trocar Câmera</span>
      </button>
    {/if}
  </div>
  <div class="card-footer bg-white border-0 rounded-bottom-4 p-4 shadow-sm">
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span class="text-secondary fw-semibold small text-uppercase tracking-wide">Captura de Fragmentos</span>
      <span class="text-primary fw-bold">{progress}%</span>
    </div>
    <div class="progress rounded-pill bg-light" style="height: 12px;">
      <div 
        class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
        role="progressbar" 
        style="width: {progress}%" 
        aria-valuenow={progress} 
        aria-valuemin="0" 
        aria-valuemax="100"
      ></div>
    </div>
    {#if errorMsg}
      <div class="alert alert-danger mt-3 mb-0 py-2 px-3 small border-0 rounded-3 fw-medium">{errorMsg}</div>
    {/if}
  </div>
</div>