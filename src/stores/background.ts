import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { z } from 'zod';

import { backgrounds, dailyBackground, type Background, type BackgroundChoice } from '../models/background';

const choiceSchema = z.enum(['random', ...backgrounds]);

/**
 * Storage key in the visitor's browser.
 */
export const backgroundStorageKey = 'anno2070rechner:background';

/**
 * Reads a stored choice, falling back to the daily image for missing or invalid data.
 *
 * @param raw - The stored text.
 * @returns The choice.
 */
export function parseBackgroundChoice(raw: string | null): BackgroundChoice {
  const result = choiceSchema.safeParse(raw);
  return result.success ? result.data : 'random';
}

/**
 * The background the visitor chose, saved in the browser, and the one that is shown.
 */
export const useBackgroundStore = defineStore('background', () => {
  const choice = useStorage<BackgroundChoice>(backgroundStorageKey, 'random', undefined, {
    serializer: { read: parseBackgroundChoice, write: value => value },
    writeDefaults: false,
    listenToStorageChanges: false,
  });

  // Decided once per page load, so an open tab keeps its image past midnight.
  const daily = dailyBackground(new Date());

  /**
   * The entry the visitor is trying out, shown instead of the saved choice.
   */
  const preview = ref<BackgroundChoice>();

  /**
   * The image of a choice.
   *
   * @param value - The choice.
   * @returns The image.
   */
  const imageOf = (value: BackgroundChoice): Background => (value === 'random' ? daily : value);

  const shown = computed(() => imageOf(preview.value ?? choice.value));

  return { choice, preview, shown, imageOf };
});
