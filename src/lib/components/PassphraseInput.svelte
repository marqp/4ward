<script lang="ts">
  import { WORDLIST, PASSPHRASE_LENGTH } from '../core/wordlist';

  let { onComplete } = $props<{ onComplete: (words: string[]) => void }>();

  let words = $state<string[]>(Array(PASSPHRASE_LENGTH).fill(''));

  function getSuggestions(input: string): string[] {
    if (!input) return [];
    const prefix = input.toLowerCase().trim();
    return WORDLIST.filter(w => w.startsWith(prefix)).slice(0, 10);
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

  // Update parent whenever words change and all are valid
  $effect(() => {
    if (words.every(w => w.length > 0 && WORDLIST.includes(w.toLowerCase().trim()))) {
      onComplete([...words.map(w => w.toLowerCase().trim())]);
    }
  });
</script>

<div class="row g-2 mb-2">
  {#each words as word, index}
    <div class="position-relative" style="flex: 1; min-width: 0;">
      <input
        id={`word-${index}`}
        type="text"
        class="form-control form-control-sm text-center border-0 bg-light rounded-pill shadow-sm fw-medium px-2"
        placeholder={`P${index + 1}`}
        value={words[index]}
        oninput={(e) => handleInput(index, e.currentTarget.value)}
        autocomplete="off"
        style="font-size: 0.85rem; height: 38px;"
      />
      {#if words[index].length > 0 && !WORDLIST.includes(words[index])}
        <ul class="list-group position-absolute w-100 shadow z-3 mt-2 rounded-4 border-0 overflow-hidden" style="top: 100%; left: 0;">
          {#each getSuggestions(words[index]) as suggestion}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <li class="list-group-item list-group-item-action py-2 px-3 border-bottom-0 cursor-pointer fw-medium text-secondary" onclick={() => handleSelect(index, suggestion)}>
              {suggestion}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/each}
</div>
<style>
  .cursor-pointer { cursor: pointer; }
</style>