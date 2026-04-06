<script lang="ts">
  import { WORDLIST, PASSPHRASE_LENGTH } from '../core/wordlist';

  let { onComplete } = $props<{ onComplete: (words: string[]) => void }>();

  let words = $state<string[]>(Array(PASSPHRASE_LENGTH).fill(''));

  function getSuggestions(input: string): string[] {
    if (!input) return [];
    const prefix = input.toLowerCase().trim();
    return WORDLIST.filter(w => w.startsWith(prefix)).slice(0, 8);
  }

  function handleInput(index: number, value: string) {
    words[index] = value;
    const suggestions = getSuggestions(value);

    if (value.length >= 2) {
      if (suggestions.length === 1) {
        words[index] = suggestions[0];
        focusNext(index);
      } else if (WORDLIST.includes(value.toLowerCase().trim())) {
        focusNext(index);
      }
    }
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

<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-2">
  {#each words as word, index}
    <div class="relative">
      <input
        id={`word-${index}`}
        type="text"
        class="w-full text-center bg-white/5 backdrop-blur-md border border-white/20 text-white placeholder-white/30 rounded-full shadow-inner font-medium px-3 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all text-sm h-11"
        placeholder={`${index + 1}`}
        value={words[index]}
        oninput={(e) => handleInput(index, e.currentTarget.value)}
        onpaste={(e) => handlePaste(index, e)}
        autocomplete="off"
      />
      {#if words[index].length > 0 && !WORDLIST.includes(words[index])}
        <ul class="absolute w-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden z-50 text-sm" style="top: 100%; left: 0; min-width: 160px;">
          {#each getSuggestions(words[index]) as suggestion}
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