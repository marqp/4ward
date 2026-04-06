/**
 * Persistent text store — stores the current draft in localStorage.
 *
 * Encapsulates all persistence logic so components don't touch
 * localStorage directly.
 */

const STORAGE_KEY = '4ward_text';

function loadText(): string {
  try { return localStorage.getItem(STORAGE_KEY) ?? ''; } catch { return ''; }
}

function saveText(text: string): void {
  try { localStorage.setItem(STORAGE_KEY, text); } catch {}
}

function clearText(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export { loadText, saveText, clearText, STORAGE_KEY };
