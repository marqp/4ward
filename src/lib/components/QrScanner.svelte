<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { FountainDecoder } from '../core/ur';
  import { IconBiArrowLeftRight, IconBiExclamationTriangle } from './icons';

  let { onComplete } = $props<{ onComplete: (data: Uint8Array) => void }>();

  let scannerId = "reader-" + Math.random().toString(36).substring(2, 9);
  let scanner: any = null;
  let ScannerClass: any = null;
  let decoder = $state(new FountainDecoder());
  let progress = $state(0);
  let errorMsg = $state('');
  let canSwitchCamera = $state(false);
  let loadingScanner = $state(true);
  let flashActive = $state(false);
  let fragmentsReceived = $state(0);
  let totalFragments = $state(0);
  const seenParts = new Set<string>();

  onMount(async () => {
    // Lazy load — so carrega o scanner quando o componente monta
    const { Scanner } = await import('../core/scanner');
    ScannerClass = Scanner;
    loadingScanner = false;
    // Pequeno delay para o DOM renderizar o container dentro do modal
    await new Promise(r => setTimeout(r, 150));
    startScanner();
  });

  function triggerFlash() {
    flashActive = true;
    setTimeout(() => { flashActive = false; }, 150);
  }

  function startScanner() {
    if (!ScannerClass) return;
    scanner = new ScannerClass(scannerId);
    scanner.start((decodedText: string) => {
      try {
        // Deduplicate: same part string scanned multiple times
        const partKey = decodedText.trim().toLowerCase();
        if (seenParts.has(partKey)) {
          return; // skip duplicate — no counter needed
        }
        seenParts.add(partKey);

        triggerFlash();
        const completed = decoder.receivePart(decodedText);
        if (completed) {
          if (import.meta.env.DEV) console.log('Decoder complete!');
          const result = decoder.getResult();
          if (result) {
            stopScanner();
            onComplete(result);
          }
        } else {
          progress = Math.round(decoder.getProgress() * 100);
          fragmentsReceived = decoder.getReceivedFragments();
          totalFragments = decoder.getTotalFragments();
          if (import.meta.env.DEV) console.log(`Fragment scanned: ${fragmentsReceived}/${totalFragments} (${progress}%) — part: ${partKey.substring(0, 50)}`);
        }
      } catch (err: any) {
        console.error('Scanner decode error:', err);
        errorMsg = decoder.getError() || err.message || 'Erro ao decodificar QR';
      }
    }, () => {
      // frames vazios ignorados
    }).then(() => {
      canSwitchCamera = scanner?.hasMultipleCameras() || false;
    }).catch((err: any) => {
      errorMsg = 'Não foi possível acessar a câmera: ' + (err?.message || err || 'verifique as permissões');
    });
  }

  async function handleSwitchCamera() {
    if (scanner) {
      try {
        await scanner.switchCamera();
      } catch (err: any) {
        errorMsg = "Erro ao trocar câmera: " + (err?.message || err || 'Erro desconhecido');
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

<div class="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center max-w-full">
  <div class="p-0 bg-black/40 relative w-full aspect-square max-w-[400px] flex-shrink-0 flex items-center justify-center overflow-hidden {flashActive ? 'ring-4 ring-green-500/80 bg-green-500/20' : 'ring-1 ring-white/10'} transition-all duration-150">
    <!-- Renderizado incondicionalmente para o Svelte nunca destruir os nós filhos gerados pelo html5-qrcode -->
    <div id={scannerId} class="w-full h-full absolute inset-0 flex items-center justify-center [&>video]:object-cover [&>video]:w-full [&>video]:h-full z-0 transition-opacity duration-300" style="opacity: {loadingScanner ? 0 : 1}; pointer-events: {loadingScanner ? 'none' : 'auto'};"></div>
    
    {#if loadingScanner}
      <div class="absolute w-8 h-8 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin z-10"></div>
    {/if}
    
    {#if canSwitchCamera}
      <button 
        class="absolute bottom-4 right-4 rounded-full px-4 py-2.5 z-30 shadow-lg border border-white/20 flex items-center gap-2 bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
        onclick={handleSwitchCamera}
      >
        <IconBiArrowLeftRight class="text-base" />
        <span class="text-xs font-bold uppercase tracking-wider">Trocar Câmera</span>
      </button>
    {/if}
  </div>
  <div class="bg-black/40 backdrop-blur-md border-t border-white/10 p-5 w-full shrink-0">
    <div class="flex justify-between items-center mb-3">
      <span class="text-white/60 font-semibold text-xs uppercase tracking-wider">Captura de Fragmentos</span>
      <span class="text-indigo-300 font-bold">{progress}% ({fragmentsReceived}/{totalFragments})</span>
    </div>
    <div class="w-full bg-black/50 rounded-full h-3.5 shadow-inner overflow-hidden border border-white/5">
      <div 
        class="bg-indigo-500 h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden" 
        style="width: {progress}%"
      >
        <div class="absolute inset-0 w-full h-full opacity-30" style="background-image: linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent); background-size: 1rem 1rem; animation: progress-bar-stripes 1s linear infinite;"></div>
      </div>
    </div>
    {#if errorMsg}
      <div class="mt-4 bg-rose-500/20 backdrop-blur-sm text-rose-200 py-2.5 px-4 text-sm border border-rose-500/30 rounded-xl font-medium shadow-lg flex items-center gap-2">
        <IconBiExclamationTriangle />{errorMsg}
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes progress-bar-stripes {
    from { background-position: 1rem 0; }
    to { background-position: 0 0; }
  }
  
  /* Force inner html5-qrcode video element to fill square and crop edges */
  :global([id^="reader-"] video) {
    object-fit: cover !important;
    width: 100% !important;
    height: 100% !important;
  }
</style>