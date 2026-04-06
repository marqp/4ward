<script lang="ts">
  import { base64ToBytes } from '../core/mnemonic';

  let { onComplete } = $props<{ onComplete: (data: Uint8Array) => void }>();

  let bulkText = $state('');
  let errorMsg = $state('');

  function handleProcess() {
    if (!bulkText.trim()) return;
    
    try {
      const cleanText = bulkText.trim();
      // Detecta se é Base64 (formato compacto do 4ward)
      if (/^[A-Za-z0-9+/=]+$/.test(cleanText) || cleanText.length > 50) {
        const data = base64ToBytes(cleanText);
        onComplete(data);
      } else {
        errorMsg = "O conteúdo colado não parece ser um dado válido do 4ward.";
      }
    } catch (err: any) {
      errorMsg = "Erro ao processar dados: Verifique se copiou o código completo.";
      console.error(err);
    }
  }
</script>

<div class="card border-0 shadow-sm rounded-4 overflow-hidden">
  <div class="card-header bg-light py-3 px-4 border-0 d-flex justify-content-between align-items-center">
    <h5 class="m-0 fw-bold text-secondary text-uppercase small tracking-wider">Entrada de Dados Compactos</h5>
    <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1 rounded-pill small fw-bold">Segurança Ativa</span>
  </div>
  <div class="card-body p-4">
    <div class="mb-4 animate-fade-in">
      <p class="small text-muted mb-3"><i class="bi bi-info-circle me-1"></i> Os dados colados serão descriptografados usando a passphrase que você digitou no passo anterior.</p>
      <label for="bulkPaste" class="form-label fw-bold small text-primary text-uppercase">Cole o código Base64:</label>
      <textarea 
        id="bulkPaste"
        class="form-control shadow-sm border-0 bg-light p-3 font-monospace" 
        rows="10" 
        placeholder="Cole o código Base64 aqui..."
        bind:value={bulkText}
        oninput={() => errorMsg = ''}
        style="resize: none; font-size: 13px; line-height: 1.4; word-break: break-all;"
      ></textarea>
    </div>

    {#if errorMsg}
      <div class="alert alert-danger py-2 px-3 small rounded-3 mb-4 border-0 animate-fade-in">
        <i class="bi bi-exclamation-circle me-2"></i>{errorMsg}
      </div>
    {/if}

    <button 
      class="btn btn-primary btn-lg w-100 fw-bold rounded-pill shadow d-flex align-items-center justify-content-center gap-2" 
      disabled={!bulkText.trim()}
      onclick={handleProcess}
    >
      <i class="bi bi-unlock-fill"></i>
      Processar e Descriptografar
    </button>
  </div>
</div>

<style>
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
