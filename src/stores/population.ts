import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { z } from 'zod';

import { groups, levelCount, type Group } from '../models/population';

/**
 * Inputs of the population calculator. Values are kept as the text of their input fields,
 * because the old calculator derived everything from that text.
 */
export interface PopulationInputs {
  /**
   * Houses per faction: index 0 is the total, then one entry per level.
   */
  residences: Record<Group, string[]>;

  /**
   * Highest allowed level per faction, as stored in the hidden field.
   */
  maxUpgrade: Record<Group, string>;

  /**
   * Position of the upgrade slider; reset moves it without changing `maxUpgrade`, as before.
   */
  upgradeSlider: Record<Group, number>;

  /**
   * Active information channel per faction: "0", "1" or "2".
   */
  info: Record<Group, string>;

  /**
   * Residents per faction: index 0 is the total, then one entry per level.
   */
  inhabitants: Record<Group, string[]>;

  /**
   * Visible boxes.
   */
  show: { residences: boolean; inhabitants: boolean; demands: boolean; production: boolean };

  /**
   * Productivity input per production building guid.
   */
  productivity: Record<string, string>;

  /**
   * Target of the commodity chain: "0" population demand, "1" maximum production.
   */
  ccTarget: string;
}

/**
 * One value per faction.
 *
 * @param value - The value for a faction.
 * @returns The values by faction.
 */
const perGroup = <T>(value: (group: Group) => T): Record<Group, T> =>
  Object.fromEntries(groups.map(group => [group, value(group)])) as Record<Group, T>;

/**
 * Input texts for the total and every level of a faction, all "0".
 *
 * @param group - The faction.
 * @returns The texts.
 */
const zeros = (group: Group): string[] => Array.from({ length: levelCount(group) + 1 }, () => '0');

/**
 * The defaults of the old calculator.
 *
 * @returns Fresh default inputs.
 */
export const defaultInputs = (): PopulationInputs => ({
  residences: perGroup(zeros),
  maxUpgrade: perGroup(group => String(levelCount(group))),
  upgradeSlider: perGroup(levelCount),
  info: perGroup(() => '0'),
  inhabitants: perGroup(zeros),
  show: { residences: true, inhabitants: false, demands: false, production: true },
  productivity: {},
  ccTarget: '0',
});

const groupRecord = <T extends z.ZodType>(schema: T): z.ZodObject<Record<Group, T>> =>
  z.object({ ecos: schema, tycoons: schema, techs: schema });

const levelTexts = z.object(perGroup(group => z.array(z.string()).length(levelCount(group) + 1)));

const storedSchema = z.object({
  residences: levelTexts,
  maxUpgrade: groupRecord(z.string()),
  upgradeSlider: groupRecord(z.number()),
  info: groupRecord(z.enum(['0', '1', '2'])),
  inhabitants: levelTexts,
  show: z.object({ residences: z.boolean(), inhabitants: z.boolean(), demands: z.boolean(), production: z.boolean() }),
  productivity: z.record(z.string(), z.string()),
  ccTarget: z.enum(['0', '1']),
});

/**
 * Storage key in the visitor's browser.
 */
export const storageKey = 'anno2070rechner:population';

/**
 * Reads stored inputs, falling back to the defaults for missing or invalid data.
 *
 * @param raw - The stored text.
 * @returns The inputs.
 */
export function parseInputs(raw: string | null): PopulationInputs {
  if (!raw) return defaultInputs();
  try {
    const result = storedSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : defaultInputs();
  } catch {
    return defaultInputs();
  }
}

/**
 * The population calculator's inputs, kept across page changes and saved in the browser.
 */
export const usePopulationStore = defineStore('population', () => {
  const inputs = useStorage<PopulationInputs>(storageKey, defaultInputs(), undefined, {
    serializer: { read: parseInputs, write: value => JSON.stringify(value) },
    writeDefaults: false,
    // The calculator keeps its own object; changes in other tabs apply on the next visit.
    listenToStorageChanges: false,
  });
  return { inputs };
});
