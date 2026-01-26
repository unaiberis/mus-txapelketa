// Load static locale files; these are the base translations but DICT can be extended at runtime
import es from '../locales/es.json';
import en from '../locales/en.json';
import eu from '../locales/eu.json';
import { writable, derived, get } from 'svelte/store';

// Lang codes are open-ended to allow adding languages at runtime
export type Lang = string;

// Reactive list of available languages (can be extended at runtime)
export const languages = writable<Array<{ code: Lang; label: string }>>([
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'eu', label: 'Euskera' }
]);

// Internal dictionary storage (mutable at runtime via addTranslations)
const DICT: Record<string, Record<string, string>> = {
  es: (es as any),
  en: (en as any),
  eu: (eu as any)
};

// Persisted language (falls back to 'es')
const persisted = (typeof window !== 'undefined') ? (localStorage.getItem('lang') as Lang | null) : null;
export const lang = writable<Lang>(persisted || 'es');
lang.subscribe((v) => {
  if (typeof window !== 'undefined') localStorage.setItem('lang', v);
});

// Derived translator function: $t('key', {n: 1})
export const t = derived(lang, ($lang) => (key: string, vars?: Record<string, any>) => {
  const val = (DICT[$lang] && DICT[$lang][key]) || (DICT['en'] && DICT['en'][key]) || key;
  if (!vars) return val;
  let out = String(val);
  Object.keys(vars).forEach((k) => {
    out = out.replace(new RegExp(`\{${k}\}`, 'g'), String(vars[k]));
  });
  return out;
});

// Add/merge translations for a language at runtime
export function addTranslations(code: string, dict: Record<string, string>) {
  DICT[code] = { ...(DICT[code] || {}), ...dict };
}

// Register a new language in the UI and optionally add translations
export function registerLanguage(code: string, label: string, dict?: Record<string, string>) {
  languages.update((lst) => {
    if (!lst.find((l) => l.code === code)) lst.push({ code, label });
    return lst;
  });
  if (dict) addTranslations(code, dict);
}

// Load translations from a remote URL (JSON) and register language if not present
export async function loadTranslations(code: string, url: string, label?: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load translations: ' + res.statusText);
  const json = await res.json();
  addTranslations(code, json);
  if (label) {
    registerLanguage(code, label);
  } else {
    // ensure language is listed
    languages.update((lst) => (lst.find((l) => l.code === code) ? lst : [...lst, { code, label: code }]));
  }
  return json;
}

// Non-reactive convenience translator
export function translateOnce(key: string, vars?: Record<string, any>) {
  const $lang = get(lang);
  const val = (DICT[$lang] && DICT[$lang][key]) || (DICT['en'] && DICT['en'][key]) || key;
  if (!vars) return val;
  let out = String(val);
  Object.keys(vars).forEach((k) => {
    out = out.replace(new RegExp(`\{${k}\}`, 'g'), String(vars[k]));
  });
  return out;
}

// Export helper to list current languages
export function listLanguages() {
  return get(languages);
}
