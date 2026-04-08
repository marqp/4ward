<script lang="ts">
  import { WORDLIST, PASSPHRASE_LENGTH } from '../core/wordlist';

  let { onComplete } = $props<{ onComplete: (words: string[]) => void }>();

  let words = $state<string[]>(Array(PASSPHRASE_LENGTH).fill(''));
  let activeIndex = $state<number | null>(null);
  let activeSuggestions = $state<string[]>([]);

  function updateSuggestions(value: string) {
    if (!value) {
      activeSuggestions = [];
      return;
    }
    const prefix = value.toLowerCase().trim();
    activeSuggestions = WORDLIST.filter(w => w.startsWith(prefix)).slice(0, 8);
  }

  function handleInput(index: number, value: string) {
    words[index] = value;
    updateSuggestions(value);

    if (value.length >= 2) {
      if (activeSuggestions.length === 1) {
        words[index] = activeSuggestions[0];
        activeSuggestions = [];
        focusNext(index);
      } else if (WORDLIST.includes(value.toLowerCase().trim())) {
        activeSuggestions = [];
        focusNext(index);
      }
    }
  }

  function handleFocus(index: number) {
    activeIndex = index;
    updateSuggestions(words[index]);
  }

  function handleBlur(index: number) {
    // Delay hiding suggestions to allow clicks to register
    setTimeout(() => {
      if (activeIndex === index) activeIndex = null;
    }, 150);
  }

  function focusNext(index: number) {
    if (index < PASSPHRASE_LENGTH - 1) {
      setTimeout(() => {
        const nextInput = document.querySelector(`#word-${index + 1}`) as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }, 10);
    }
  }

  function handleSelect(index: number, word: string) {
    words[index] = word;
    activeSuggestions = [];
    focusNext(index);
  }

  // Paste: auto-split words into fields
  function handlePaste(index: number, e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text')?.trim();
    if (!text) return;

    const tokens = text.split(/[\s,;]+/).filter(Boolean);
    if (tokens.length <= 1) return; // single word — let default paste happen

    e.preventDefault();
    const cleaned = tokens.map(t => t.toLowerCase().trim());

    // Fill starting from current index
    for (let i = 0; i < Math.min(cleaned.length, PASSPHRASE_LENGTH - index); i++) {
      words[index + i] = cleaned[i];
    }

    // Focus next empty field or last filled
    const nextIdx = Math.min(index + cleaned.length, PASSPHRASE_LENGTH - 1);
    setTimeout(() => {
      const nextInput = document.querySelector(`#word-${nextIdx}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }, 10);
  }

  // Notify parent when all words are valid
  $effect(() => {
    if (words.every(w => w.length > 0 && WORDLIST.includes(w.toLowerCase().trim()))) {
      onComplete([...words.map(w => w.toLowerCase().trim())]);
    }
  });
</script>

<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
  {#each words as word, index}
    <div class="relative w-full">
      <input
        id={`word-${index}`}
        type="text"
        class="w-full text-center bg-white/5 backdrop-blur-md border border-white/20 text-white placeholder-white/30 rounded-full shadow-inner font-medium px-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all text-sm h-11 tracking-wide"
        placeholder={`${index + 1}`}
        value={words[index]}
        oninput={(e) => handleInput(index, e.currentTarget.value)}
        onfocus={() => handleFocus(index)}
        onblur={() => handleBlur(index)}
        onpaste={(e) => handlePaste(index, e)}
        autocomplete="off"
      />
      {#if activeIndex === index && activeSuggestions.length > 0 && !WORDLIST.includes(words[index])}
        <ul class="absolute w-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden z-50 text-sm" style="top: 100%; left: 0; min-width: 140px;">
          {#each activeSuggestions as suggestion}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <li class="py-2.5 px-4 cursor-pointer font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors border-b border-white/5 last:border-0" onclick={() => handleSelect(index, suggestion)}>
              {suggestion}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/each}
</div>