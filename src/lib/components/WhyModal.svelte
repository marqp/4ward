<script lang="ts">
  import { IconBiXLg, IconBiShieldLockFill, IconBiExclamationTriangleFill } from './icons';

  let { onClose } = $props<{ onClose: () => void }>();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
  <!-- Backdrop -->
  <div
    class="absolute inset-0 bg-slate-950/60 backdrop-blur-md cursor-pointer"
    onclick={onClose}
    aria-hidden="true"
  ></div>

  <!-- Modal Content -->
  <div role="dialog" aria-modal="true" aria-labelledby="why-title" class="bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl relative w-full max-w-2xl overflow-hidden flex flex-col animate-scale-up">
    <!-- Header Decor -->
    <div class="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
    
    <button
      class="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors z-10 border border-white/10 shadow-lg"
      onclick={onClose}
    >
      <IconBiXLg />
    </button>

    <div class="p-8 md:p-10">
      <div class="flex items-center gap-4 mb-8">
        <div class="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
          <IconBiShieldLockFill class="text-2xl" />
        </div>
        <h2 id="why-title" class="text-2xl md:text-3xl font-bold text-white tracking-tight m-0">Segurança & Ética</h2>
      </div>

      <div class="space-y-6 text-slate-300 leading-relaxed text-lg">
        <p>
          Atualmente, existem inúmeros blocos de notas online e ferramentas de transferência que contêm informações sensíveis de pacientes totalmente desprotegidas e expostas.
        </p>

        <div class="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 flex gap-4 items-start">
          <IconBiExclamationTriangleFill class="text-rose-400 shrink-0 mt-1 text-xl" />
          <p class="text-rose-200 m-0">
            O uso de ferramentas não criptografadas para dados médicos viola o sigilo profissional e coloca em risco a privacidade do paciente.
          </p>
        </div>

        <p>
          O <strong class="text-white font-semibold italic">4ward</strong> nasceu para tornar o processo de criptografia 
          <span class="text-indigo-400 font-bold underline decoration-indigo-400/30 underline-offset-4 text-xl">fácil e rápido</span>.
        </p>

        <p>
          Nosso objetivo é garantir que você não precise abrir mão da conveniência dos blocos de notas online, mas que possa fazê-lo de forma segura, garantindo que ninguém tenha acesso aos dados dos seus pacientes (nem mesmo nós).
        </p>

      </div>

      <div class="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <p class="text-xs text-slate-400 m-0 leading-relaxed">
            Esta ferramenta <strong class="text-emerald-400 font-bold">não envia ou armazena dados</strong> em servidores de terceiros. Todo processamento é 100% offline.
          </p>
        </div>
        <button 
          class="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 whitespace-nowrap"
          onclick={onClose}
        >
          Entendi
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .animate-fade-in { animation: fadeIn 0.3s ease-out; }
  .animate-scale-up { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
  
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>
