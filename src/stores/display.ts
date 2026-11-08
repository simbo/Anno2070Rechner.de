import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { z } from 'zod/mini';

/**
 * The boxes of the population calculator that can be shown or hidden.
 */
export interface VisibleBoxes {
  residences: boolean;
  inhabitants: boolean;
  demands: boolean;
  production: boolean;
}

/**
 * Storage key in the visitor's browser.
 */
export const displayStorageKey = 'anno2070rechner:boxes';

const defaultBoxes = (): VisibleBoxes => ({ residences: true, inhabitants: false, demands: false, production: true });

const boxesSchema = z.object({
  residences: z.boolean(),
  inhabitants: z.boolean(),
  demands: z.boolean(),
  production: z.boolean(),
});

/**
 * Reads stored boxes, falling back to the defaults for invalid data or if none is visible.
 *
 * @param raw - The stored text.
 * @returns The visible boxes.
 */
export function parseBoxes(raw: string | null): VisibleBoxes {
  try {
    const result = boxesSchema.safeParse(JSON.parse(raw ?? 'null'));
    return result.success && Object.values(result.data).some(Boolean) ? result.data : defaultBoxes();
  } catch {
    return defaultBoxes();
  }
}

/**
 * General display settings of the population calculator, independent of the current game.
 */
export const useDisplayStore = defineStore('display', () => {
  const show = useStorage<VisibleBoxes>(displayStorageKey, defaultBoxes(), undefined, {
    serializer: { read: parseBoxes, write: value => JSON.stringify(value) },
    writeDefaults: false,
    listenToStorageChanges: false,
  });
  return { show };
});
