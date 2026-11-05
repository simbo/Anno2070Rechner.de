import { computed, shallowReactive, type ComputedRef } from 'vue';

import { useLanguage } from './i18n';
import { loadCatalog, type Catalog } from './models/game-data';
import type { Language } from './routes';

const loaded = shallowReactive(new Map<Language, Catalog>());
const pending = new Map<Language, Promise<Catalog>>();

/**
 * Loads the catalog of a language once. The router waits for it before showing a page,
 * so components can use the catalog synchronously.
 *
 * @param language - The language.
 * @returns The catalog.
 */
export async function ensureCatalog(language: Language): Promise<Catalog> {
  let promise = pending.get(language);
  if (!promise) {
    promise = loadCatalog(language).then(catalog => {
      loaded.set(language, catalog);
      return catalog;
    });
    pending.set(language, promise);
  }
  return promise;
}

/**
 * The catalog of the current route's language.
 *
 * @returns The catalog; it is always loaded while a page is shown.
 */
export function useCatalog(): ComputedRef<Catalog> {
  const language = useLanguage();
  return computed(() => {
    const catalog = loaded.get(language.value);
    if (!catalog) throw new Error(`Catalog for "${language.value}" is not loaded`);
    return catalog;
  });
}
