<script lang="ts">
  import QrTransmitter from './QrTransmitter.svelte';
  import { bytesToBase64 } from '../core/mnemonic';

  let { payloadToSend, sendPassphrase, onClose } = $props<{
    payloadToSend: Uint8Array;
    sendPassphrase: string[];
    onClose: () => void;
  }>();

  let compactString = $derived(bytesToBase64(payloadToSend));
  let copyStatus = $state('Copiar Dados Compactos');
  let copyErrorMsg = $state('');

  // Privacy Logic
  let showPassphrase = $state(false);
  let displayPassphrase = $derived(showPassphrase
    ? sendPassphrase.join(' ').toUpperCase()
    : '•••• •••• •••• •••• •••• ••••');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(compactString);
      copyStatus = 'Copiado!';
      copyErrorMsg = '';
      setTimeout(() => copyStatus = 'Copiar Dados Compactos', 2000);
    } catch (err: any) {
      copyErrorMsg = 'Selecione o texto manualmente.';
      copyStatus = 'Falha ao copiar';
      setTimeout(() => { copyStatus = 'Copiar Dados Compactos'; copyErrorMsg = ''; }, 3000);
    }
  }
</script>

<div class="position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center p-2 p-md-4 animate-fade-in" style="background-color: rgba(15, 23, 42, 0.92); backdrop-filter: blur(12px);">
  <div class="bg-white rounded-4 shadow-lg d-flex flex-column overflow-hidden position-relative" style="width: auto; max-width: 96vw; height: 100%; max-height: 94vh;">
    
    <button class="btn btn-light btn-sm position-absolute top-0 end-0 m-3 rounded-circle shadow-sm z-3 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px; border: none;" aria-label="Close" onclick={onClose}>
      <i class="bi bi-x-lg text-secondary"></i>
    </button>

    <div class="d-flex flex-column flex-lg-row h-100 overflow-hidden">
      <!-- Lado Esquerdo: QR Code (Área Flexível) -->
      <div class="bg-light d-flex align-items-center justify-content-center border-end h-100" style="flex: 1; min-width: 300px; min-height: 0;">
        <div class="w-100 h-100 d-flex align-items-center justify-content-center p-3 p-md-4">
           <div class="w-100 h-100 d-flex align-items-center justify-content-center" style="max-width: 650px; aspect-ratio: 1/1;">
             <QrTransmitter payload={payloadToSend} />
           </div>
        </div>
      </div>
      
      <!-- Lado Direito: Container com largura fixa/adaptável -->
      <div class="d-flex flex-column bg-white h-100 shadow-sm" style="width: 400px; max-width: 500px;">
        
        <!-- Área Scrollável (Opções) -->
        <div class="p-4 p-md-4 overflow-auto flex-grow-1">
          <h3 class="fw-bold text-dark mb-4 fs-4 border-bottom pb-3 text-uppercase tracking-tight">Transferência</h3>
          
          <!-- Opção Óptica -->
          <div class="mb-4 animate-slide-in" style="animation-delay: 0.1s;">
            <div class="d-flex align-items-center gap-2 mb-2">
              <div class="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                <i class="bi bi-qr-code fs-5"></i>
              </div>
              <p class="fw-bold m-0 text-primary text-uppercase tracking-widest small">Opção 1: Óptica</p>
            </div>
            <p class="text-muted small lh-base mb-0">
              Escaneie o código dinâmico para transferência imediata entre dispositivos físicos sem rede.
            </p>
          </div>

          <!-- Opção Compacta -->
          <div class="mb-2 animate-slide-in" style="animation-delay: 0.2s;">
            <div class="d-flex align-items-center gap-2 mb-2">
              <div class="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                <i class="bi bi-clipboard-data fs-5"></i>
              </div>
              <p class="fw-bold m-0 text-primary text-uppercase tracking-widest small">Opção 2: Compacta</p>
            </div>
            <p class="text-muted small lh-base mb-3">
              Criptografado (AES-256). Seguro para envio via WhatsApp ou E-mail.
            </p>
            
            <div class="bg-light rounded-4 p-3 mb-2 border">
              <textarea 
                readonly 
                class="form-control border-0 bg-transparent p-0 small text-muted font-monospace" 
                rows="3" 
                style="resize: none; font-size: 10px; line-height: 1.3; word-break: break-all;"
                value={compactString}
              ></textarea>
            </div>
            
            <button
              class="btn btn-primary w-100 py-2 fw-bold shadow-sm rounded-pill d-flex align-items-center justify-content-center gap-2 transition-all small"
              onclick={handleCopy}
            >
              <i class="bi {copyStatus.includes('Copiado') ? 'bi-check2-all' : copyStatus.includes('Falha') ? 'bi-exclamation-triangle' : 'bi-clipboard2-check'}"></i>
              {copyStatus}
            </button>
            {#if copyErrorMsg}
              <p class="text-danger small text-center mt-1 mb-0">{copyErrorMsg}</p>
            {/if}
          </div>
        </div>

        <!-- Footer Fixo Compacto: Chave de Acesso -->
        <div class="p-3 border-top bg-light bg-opacity-25 flex-shrink-0">
          <div class="d-flex justify-content-between align-items-center mb-2 px-1">
            <p class="fw-bold small text-danger text-uppercase tracking-widest m-0" style="font-size: 0.7rem;">
              <i class="bi bi-shield-lock-fill me-1"></i>Chave de Acesso
            </p>
            <button 
              class="btn btn-link text-secondary p-0 text-decoration-none transition-all" 
              onclick={() => showPassphrase = !showPassphrase}
            >
              <i class="bi {showPassphrase ? 'bi-eye-slash-fill' : 'bi-eye-fill'} fs-6"></i>
            </button>
          </div>
          
          <div 
            class="bg-primary bg-opacity-10 p-2 rounded-3 border border-primary border-opacity-10 text-center overflow-hidden"
            style="min-height: 54px; height: auto; display: flex; align-items: center; justify-content: center;"
          >
            <!-- white-space: normal permite quebra em duas linhas -->
            <span 
              class="font-monospace text-uppercase fw-bold text-primary"
              style="font-size: 1.1rem; letter-spacing: {showPassphrase ? '1px' : '4px'}; opacity: {showPassphrase ? 1 : 0.8}; line-height: 1.2; word-break: break-word;"
            >
              {displayPassphrase}
            </span>
          </div>
          
          <p class="text-center text-muted mt-2 mb-0" style="font-size: 10px;">
            Necessária para descriptografar os dados em ambos os métodos.
          </p>
        </div>
        
      </div>
    </div>
  </div>
</div>

<style>
  .transition-all { transition: all 0.2s ease-in-out; }
  .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  .animate-slide-in { 
    opacity: 0;
    animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.98) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(15px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .overflow-auto::-webkit-scrollbar {
    width: 3px;
  }
  .overflow-auto::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.1);
    border-radius: 10px;
  }
</style>
