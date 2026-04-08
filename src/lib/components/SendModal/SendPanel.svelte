<script lang="ts">
  import { onDestroy } from 'svelte';
  import { bytesToBase64 } from '../../utils/encoding';
  import { wipeMemory } from '../../utils/memory';
  import {
    IconBiSendFill,
    IconBiQrCode,
    IconBiClipboard,
    IconBiClipboard2Check,
    IconBiCheck2All,
    IconBiExclamationTriangle,
    IconBiShieldLockFill,
    IconBiEyeFill,
    IconBiEyeSlashFill,
  } from '../icons';

  let { payload, passphrase } = $props<{
    payload: Uint8Array;
    passphrase: string[];
  }>();

  // Limpa passphrase da memória quando o componente é desmontado
  onDestroy(() => {
    wipeMemory(passphrase);
  });

  // ─── Base64 Copy ───

  let copyStatus = $state('Copiar código');
  let copyErrorMsg = $state('');
  
  // Create a tiny preview that won't block the thread during reactivity
  let base64Preview = $derived(bytesToBase64(payload.slice(0, 48)) + '...');

  async function handleCopy() {
    try {
      // Calculate full base64 ONLY when user clicks copy
      const fullBase64 = bytesToBase64(payload);
      await navigator.clipboard.writeText(fullBase64);
      copyStatus = 'Copiado!';
      copyErrorMsg = '';
      setTimeout(() => copyStatus = 'Copiar código', 2000);
    } catch {
      copyErrorMsg = 'Falha ao copiar automaticamente.';
      copyStatus = 'Falha ao copiar';
      setTimeout(() => { copyStatus = 'Copiar código'; copyErrorMsg = ''; }, 3000);
    }
  }

  // ─── Passphrase visibility & copy ───

  let showPassphrase = $state(false);
  let hidePassphraseTimer: ReturnType<typeof setTimeout> | null = null;
  let passphraseCopied = $state(false);

  function togglePassphrase() {
    showPassphrase = !showPassphrase;
    if (hidePassphraseTimer) clearTimeout(hidePassphraseTimer);
    if (showPassphrase) {
      hidePassphraseTimer = setTimeout(() => { showPassphrase = false; }, 10000);
    }
  }

  async function handleCopyPassphrase() {
    try {
      await navigator.clipboard.writeText(passphrase.join(' ').toUpperCase());
      passphraseCopied = true;
      setTimeout(() => passphraseCopied = false, 2000);
    } catch {}
  }
</script>

<div class="flex flex-col bg-white/5 h-full w-full lg:w-[400px] shrink-0">
  <div class="overflow-y-auto flex-grow p-6 md:p-8 custom-scrollbar">
    <h3 class="font-bold text-xl mb-8 flex items-center gap-3 text-white">
      <IconBiSendFill class="text-indigo-400" /> Transferência
    </h3>

    <div class="mb-8 animate-slide-in" style="animation-delay: 0.1s;">
      <div class="flex items-center gap-3 mb-3">
        <div class="bg-indigo-500/20 border border-indigo-400/30 w-10 h-10 flex items-center justify-center rounded-xl text-indigo-300 shadow-inner"><IconBiQrCode class="text-lg" /></div>
        <p class="font-bold m-0 text-indigo-300 uppercase tracking-widest text-xs">Escaneie o QR</p>
      </div>
      <p class="text-white/60 text-sm leading-relaxed mb-0 pl-1">
        <strong class="text-indigo-300 italic">De dentro do app</strong>, escaneie o QR. Aponte a câmera do dispositivo receptor para o código animado ao lado. Apenas abrir o aplicativo de câmera não irá funcionar.
      </p>
    </div>

    <div class="mb-6 animate-slide-in" style="animation-delay: 0.2s;">
      <div class="flex items-center gap-3 mb-3">
        <div class="bg-indigo-500/20 border border-indigo-400/30 w-10 h-10 flex items-center justify-center rounded-xl text-indigo-300 shadow-inner"><IconBiClipboard class="text-lg" /></div>
        <p class="font-bold m-0 text-indigo-300 uppercase tracking-widest text-xs">Ou copie o código</p>
      </div>
      <p class="text-white/60 text-sm leading-relaxed mb-4 pl-1">Envie por e-mail, WhatsApp ou Invertexto. Seguro — só quem tem a chave de acesso pode ler.</p>

      <div class="bg-black/40 rounded-2xl p-4 mb-4 border border-white/10 shadow-inner relative group">
        <textarea readonly class="w-full bg-transparent border-0 p-0 text-xs text-white/50 font-mono resize-none focus:outline-none break-all" rows="3" value={base64Preview}></textarea>
      </div>

      <button class="w-full py-3.5 bg-indigo-500/80 hover:bg-indigo-500 text-white font-semibold shadow-lg rounded-2xl flex items-center justify-center gap-2 transition-all text-sm border border-indigo-400/30 backdrop-blur-sm" onclick={handleCopy}>
        {#if copyStatus.includes('Copiado')}
          <IconBiCheck2All class="text-lg" />
        {:else if copyStatus.includes('Falha')}
          <IconBiExclamationTriangle class="text-lg" />
        {:else}
          <IconBiClipboard2Check class="text-lg" />
        {/if}
        {copyStatus}
      </button>
      {#if copyErrorMsg}<p role="alert" aria-live="assertive" class="text-rose-400 text-xs text-center mt-3 mb-0">{copyErrorMsg}</p>{/if}
    </div>
  </div>

  <!-- Footer Passphrase -->
  <div class="p-6 border-t border-white/10 bg-black/30 shrink-0 backdrop-blur-md">
    <div class="flex justify-between items-center mb-3 px-1">
      <p class="font-bold text-xs text-rose-400 uppercase tracking-widest m-0 flex items-center">
        <IconBiShieldLockFill class="mr-2" />Chave de Acesso
      </p>
      <div class="flex items-center gap-1">
        <button class="text-white/50 hover:text-white transition-colors p-1" aria-label="Copiar chave" title="Copiar chave" onclick={handleCopyPassphrase}>
          {#if passphraseCopied}
            <IconBiCheck2All class="text-lg text-emerald-400" />
          {:else}
            <IconBiClipboard class="text-lg" />
          {/if}
        </button>
        <button class="text-white/50 hover:text-white transition-colors p-1" aria-label={showPassphrase ? 'Ocultar chave' : 'Mostrar chave'} title={showPassphrase ? 'Ocultar chave' : 'Mostrar chave'} onclick={togglePassphrase}>
          {#if showPassphrase}
            <IconBiEyeSlashFill class="text-lg" />
          {:else}
            <IconBiEyeFill class="text-lg" />
          {/if}
        </button>
      </div>
    </div>
    <div class="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 text-center flex items-center justify-center min-h-[64px] shadow-inner">
      <span class="font-mono uppercase font-bold text-rose-300 text-base leading-relaxed break-words transition-all" style="letter-spacing: {showPassphrase ? '2px' : '4px'}; opacity: {showPassphrase ? 1 : 0.8};">
        {showPassphrase ? passphrase.join(' ').toUpperCase() : '•••• •••• •••• •••• •••• •••• •••• ••••'}
      </span>
    </div>
  </div>
</div>

<style>
  .animate-slide-in { opacity: 0; animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes slideIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
</style>
