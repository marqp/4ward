<script lang="ts">
  import { compressAndTokenize, decompressAndDetokenize } from './lib/core/compression';
  import { encryptData, decryptData } from './lib/core/crypto';
  import { WORDLIST, PASSPHRASE_LENGTH } from './lib/core/wordlist';
  import QrScanner from './lib/components/QrScanner.svelte';
  import MnemonicInput from './lib/components/MnemonicInput.svelte';
  import PassphraseInput from './lib/components/PassphraseInput.svelte';
  import TransmitModal from './lib/components/TransmitModal.svelte';

  let mode = $state<'send' | 'receive'>('send');
  let receiveMethod = $state<'scan' | 'manual'>('scan');

  // SEND STATE
  let textToSend = $state('');
  let sendPassphrase = $state<string[]>([]);
  let payloadToSend = $state<Uint8Array | null>(null);
  let isProcessing = $state(false);
  let globalError = $state('');

  // RECEIVE STATE
  let receivePassphrase = $state<string[]>([]);
  let scanning = $state(false);
  let receivedText = $state('');
  let receiveError = $state('');

  function generatePassphrase(): string[] {
    const words: string[] = [];
    const array = new Uint32Array(PASSPHRASE_LENGTH);
    crypto.getRandomValues(array);
    for (let i = 0; i < PASSPHRASE_LENGTH; i++) {
      words.push(WORDLIST[array[i] % WORDLIST.length]);
    }
    return words;
  }

  async function handleSend() {
    if (!textToSend.trim()) return;
    isProcessing = true;
    globalError = '';
    try {
      // Pequeno delay para permitir que o UI mostre o loader se o texto for gigante
      await new Promise(r => setTimeout(r, 50));
      sendPassphrase = generatePassphrase();
      const compressed = compressAndTokenize(textToSend);
      console.log("Dados comprimidos:", compressed.length, "bytes");
      
      if (compressed.length > 10240) {
        globalError = 'Aviso: O texto é muito longo (>10KB após compressão). A transmissão óptica pode ser lenta ou instável.';
      }

      payloadToSend = await encryptData(compressed, sendPassphrase);
      console.log("Dados criptografados:", payloadToSend.length, "bytes");
    } catch (err: any) {
      globalError = 'Falha ao encriptar dados: ' + (err.message || 'Erro desconhecido');
      console.error(err);
    } finally {
      isProcessing = false;
    }
  }

  function closeModal() {
    sendPassphrase = [];
    payloadToSend = null;
  }

  function clearText() {
    textToSend = '';
    globalError = '';
    closeModal();
  }

  async function handleReceiveScan(data: Uint8Array) {
    scanning = false;
    receiveError = '';
    isProcessing = true;
    try {
      const decrypted = await decryptData(data, receivePassphrase);
      receivedText = decompressAndDetokenize(decrypted);
    } catch (err: any) {
      receiveError = 'Falha ao descriptografar. Verifique a Passphrase ou integridade dos dados.';
      console.error(err);
    } finally {
      isProcessing = false;
    }
  }

  let copyFeedback = $state('');

  async function handleCopyToClipboard() {
    try {
      await navigator.clipboard.writeText(receivedText);
      copyFeedback = 'Copiado!';
      setTimeout(() => copyFeedback = '', 2000);
    } catch (err: any) {
      receiveError = 'Falha ao copiar para a área de transferência. Selecione o texto manualmente.';
      console.error('Clipboard error:', err);
    }
  }
</script>

<main class="d-flex flex-column min-vh-100 overflow-hidden" style="background-color: #f4f6f8;">
  <header class="sticky-top bg-white shadow-sm py-2 px-3 z-2">
    <div class="container-fluid d-flex flex-wrap align-items-center justify-content-between p-0">
      <div class="d-flex align-items-baseline gap-2">
        <h1 class="h4 fw-bold text-primary m-0" style="letter-spacing: -0.5px;">4ward</h1>
        <span class="text-muted small d-none d-sm-inline fw-medium">Transferência Segura Offline</span>
      </div>
      <div class="d-flex gap-2 bg-light p-1 rounded-pill border border-light">
        <button 
          class="btn {mode === 'send' ? 'btn-primary' : 'btn-light text-muted border-0'} btn-sm fw-bold px-4 rounded-pill transition-all" 
          onclick={() => { mode = 'send'; clearText(); }}
        >
          ENVIAR
        </button>
        <button 
          class="btn {mode === 'receive' ? 'btn-primary' : 'btn-light text-muted border-0'} btn-sm fw-bold px-4 rounded-pill transition-all" 
          onclick={() => { mode = 'receive'; scanning = false; receivedText = ''; receiveError = ''; }}
        >
          RECEBER
        </button>
      </div>
    </div>
  </header>

  <div class="flex-grow-1 d-flex flex-column overflow-auto">
    <div class="container-fluid py-3 flex-grow-1 d-flex flex-column px-0 px-md-3">
      {#if mode === 'send'}
        <div class="animate-fade-in flex-grow-1 d-flex flex-column position-relative px-2 px-md-0">
          <div class="d-flex justify-content-between align-items-center mb-2 px-1">
            <h2 class="h6 m-0 text-secondary fw-semibold text-uppercase tracking-wider">Editor de Texto</h2>
            <button 
              class="btn btn-link btn-sm text-danger text-decoration-none fw-bold p-0" 
              onclick={clearText}
              disabled={!textToSend.trim()}
              style="opacity: {textToSend.trim() ? 1 : 0.5}; cursor: {textToSend.trim() ? 'pointer' : 'default'};"
            >
              <i class="bi bi-trash3 me-1"></i>Limpar
            </button>
          </div>
          
          <textarea 
            class="form-control flex-grow-1 shadow-sm fs-5 border-0 rounded-4 p-4 mb-2 w-100" 
            placeholder="Cole aqui o texto a ser enviado" 
            bind:value={textToSend}
            style="resize: none; min-height: 200px;"
            disabled={isProcessing}
          ></textarea>

          {#if globalError}
            <div class="alert alert-danger border-0 rounded-3 shadow-sm py-2 mb-2 animate-fade-in">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>{globalError}
            </div>
          {/if}
          
          <button 
            class="btn btn-primary shadow-lg fab-button-extended transition-all d-flex align-items-center justify-content-center gap-2 px-4" 
            onclick={handleSend} 
            disabled={!textToSend.trim() || isProcessing}
            title="Gerar QR Code Seguro"
          >
            {#if isProcessing}
              <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span class="fw-bold text-uppercase tracking-wider small">Processando...</span>
            {:else}
              <i class="bi bi-qr-code fs-4"></i>
              <span class="fw-bold text-uppercase tracking-wider small">Enviar Texto</span>
            {/if}
          </button>
        </div>

      {:else if mode === 'receive'}
        <div class="animate-fade-in">
          <h2 class="h6 mb-3 text-secondary fw-semibold text-uppercase tracking-wider">Receber Texto</h2>

          {#if isProcessing && !scanning}
            <div class="d-flex flex-column align-items-center justify-content-center py-5 my-5">
              <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
              <p class="text-secondary fw-medium">Descriptografando dados...</p>
            </div>
          {:else if !receivedText && !scanning}
            <div class="card mb-4 shadow-sm border-0 rounded-4 bg-white overflow-hidden">
              <div class="card-body p-4 p-md-5">
                <span class="form-label fw-bold text-secondary d-block mb-4 fs-5">1. Digite a Passphrase ({PASSPHRASE_LENGTH} palavras):</span>
                <PassphraseInput onComplete={(words) => receivePassphrase = words} />
                
                <div class="row g-3 mt-4">
                  <div class="col-md-6">
                    <button 
                      class="btn {receiveMethod === 'scan' ? 'btn-primary' : 'btn-outline-primary'} w-100 py-3 fw-bold rounded-4 shadow-sm h-100" 
                      onclick={() => receiveMethod = 'scan'}
                    >
                      <i class="bi bi-camera fs-4 d-block mb-1"></i>
                      Usar Câmera
                    </button>
                  </div>
                  <div class="col-md-6">
                    <button 
                      class="btn {receiveMethod === 'manual' ? 'btn-primary' : 'btn-outline-primary'} w-100 py-3 fw-bold rounded-4 shadow-sm h-100" 
                      onclick={() => receiveMethod = 'manual'}
                    >
                      <i class="bi bi-keyboard fs-4 d-block mb-1"></i>
                      Entrada Manual
                    </button>
                  </div>
                </div>

                <div class="d-grid mt-4">
                  <button
                    class="btn btn-primary btn-lg fw-bold py-3 shadow rounded-pill"
                    onclick={() => { scanning = true; receiveError = ''; }}
                    disabled={receivePassphrase.length !== PASSPHRASE_LENGTH || receivePassphrase.some(w => !WORDLIST.includes(w))}
                  >
                    2. Começar Recebimento
                  </button>
                </div>
              </div>
            </div>
          {/if}

          {#if scanning}
            <div class="text-center mb-4">
              <span class="badge bg-primary bg-opacity-10 text-primary fs-5 py-2 px-4 rounded-pill border border-primary border-opacity-25 shadow-sm">Chave: {receivePassphrase.join(' ')}</span>
            </div>
            
            {#if receiveMethod === 'scan'}
              <div class="bg-white rounded-4 shadow-sm overflow-hidden mb-4">
                <QrScanner onComplete={handleReceiveScan} />
              </div>
            {:else}
              <div class="mb-4">
                <MnemonicInput onComplete={handleReceiveScan} />
              </div>
            {/if}

            <div class="d-grid">
              <button class="btn btn-light text-danger py-3 fw-bold rounded-pill shadow-sm border" onclick={() => scanning = false}>Cancelar Recebimento</button>
            </div>
          {/if}

          {#if receiveError}
            <div class="alert alert-danger mt-4 shadow-sm fs-5 border-0 rounded-4">{receiveError}</div>
          {/if}

          {#if receivedText}
            <div class="card border-0 shadow-sm mt-4 rounded-4 overflow-hidden">
              <div class="card-header bg-success text-white fw-bold fs-5 py-3 border-0">Texto Recebido com Sucesso</div>
              <div class="card-body p-0">
                <textarea class="form-control border-0 bg-light fs-5 p-4" rows="15" readonly value={receivedText} style="border-radius: 0; resize: none;"></textarea>
              </div>
              <div class="card-footer bg-white border-0 p-4">
                 <button class="btn btn-success btn-lg w-100 fw-bold shadow rounded-pill" onclick={handleCopyToClipboard}>
                   {#if copyFeedback}{copyFeedback}{:else}Copiar para a Área de Transferência{/if}
                 </button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</main>

{#if payloadToSend}
  <TransmitModal payloadToSend={payloadToSend} sendPassphrase={sendPassphrase} onClose={closeModal} />
{/if}

<style>
  :global(.transition-all) { transition: all 0.2s ease-in-out; }
  .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .fab-button-extended {
    position: fixed;
    bottom: 2.5rem;
    right: 2.5rem;
    height: 60px;
    border-radius: 30px;
    z-index: 100;
  }

  .fab-button-extended:hover {
    transform: scale(1.05);
  }

  .fab-button-extended:active {
    transform: scale(0.95);
  }

  :global(.form-control:focus) {
    box-shadow: none;
    border-color: transparent;
  }
</style>