import { efficiencyClass, filterNum } from '../lib/legacy';
import type { Language } from '../routes';

import { tonsPerMinute, type Catalog } from './game-data';
import { KILOGRAMS_PER_TON, PERCENT, RESIDENTS_PER_DEMAND } from './units';

/**
 * The three factions of the game.
 */
export type Group = 'ecos' | 'tycoons' | 'techs';

/**
 * Factions in display order.
 */
export const groups: readonly Group[] = ['ecos', 'tycoons', 'techs'];

/**
 * Residents per house and level of each faction, without bonus.
 */
const capacities: Record<Group, readonly number[]> = {
  ecos: Object.values({ workers: 8, employees: 15, engineers: 25, executives: 40 }),
  tycoons: Object.values({ workers: 8, employees: 15, engineers: 25, executives: 40 }),
  techs: Object.values({ assistants: 5, researchers: 30 }),
};

/**
 * Steps the old calculator used when distributing houses over the levels.
 */
const distributionSteps: Record<Group, number> = { ecos: 5, tycoons: 5, techs: 4 };

/**
 * Number of resident levels per faction.
 *
 * @param group - The faction.
 * @returns The number of levels.
 */
export const levelCount = (group: Group): number => capacities[group].length;

/**
 * Residents per house and level, without bonus.
 *
 * @param group - The faction.
 * @returns Residents per house for each level.
 */
export const residenceCapacity = (group: Group): readonly number[] => capacities[group];

/**
 * Products whose demand the second Eco information channel lowers: communicators,
 * 3D projectors and home robots.
 */
export const lifestyleProducts: readonly number[] = Object.values({
  communicators: 2_500_029,
  projectors: 2_500_030,
  robots: 2_500_031,
});

/**
 * Remaining demand for lifestyle products with the second Eco information channel.
 */
const LIFESTYLE_FACTOR = 0.85;

/**
 * Living space with the first information channel.
 */
const LIVING_SPACE_BONUS = 1.12;

/**
 * Share of houses moving up per level step when distributing: 20 % per remaining step.
 */
const UPGRADE_SHARE = 0.2;

/**
 * Distributes a total number of houses over the levels like the old calculator: each
 * level up to the allowed upgrade takes a share of the level below.
 *
 * @param group - The faction.
 * @param total - Total number of houses.
 * @param maxUpgrade - Highest allowed level, 1 to 4 (techs 1 to 2).
 * @returns Houses per level.
 */
export function distributeResidences(group: Group, total: number, maxUpgrade: number): number[] {
  const values = [total, ...Array.from({ length: levelCount(group) - 1 }, () => 0)];
  const steps = distributionSteps[group];
  for (let level = 1; level < maxUpgrade; level++) {
    values[level] = Math.floor(values[level - 1] * (UPGRADE_SHARE * (steps - level)));
    values[level] = values[level - 1] <= values[level] ? 0 : values[level];
    values[level - 1] -= values[level];
  }
  return values.slice(0, levelCount(group));
}

/**
 * Residents per level from the number of houses. The first information channel adds
 * 12 % living space, rounded down per house.
 *
 * @param group - The faction.
 * @param houses - Houses per level.
 * @param moreSpace - Whether the living space bonus is active.
 * @returns Residents per level.
 */
export function residentsFromHouses(group: Group, houses: readonly number[], moreSpace: boolean): number[] {
  const capacity = residenceCapacity(group);
  return capacity.map(
    (places, level) => (houses[level] ?? 0) * Math.floor(places * (moreSpace ? LIVING_SPACE_BONUS : 1)),
  );
}

/**
 * Residents per level key such as `ecos1` or `techs2`.
 */
export type Residents = Record<string, number>;

/**
 * Demand in tons per minute per product guid.
 */
export type Demands = Map<number, number>;

/**
 * Calculates the demands like the old calculator: per 100 residents of a level, the
 * game's amount in kilograms per minute.
 *
 * @param catalog - The game data.
 * @param residents - Residents per level key.
 * @param lessLifestyle - Whether the second Eco information channel is active.
 * @returns Demand per product, in display order.
 */
export function calculateDemands(catalog: Catalog, residents: Residents, lessLifestyle: boolean): Demands {
  const demands: Demands = new Map();
  for (const { product, amounts } of catalog.demands) {
    const multiplier = lessLifestyle && lifestyleProducts.includes(product) ? LIFESTYLE_FACTOR : 1;
    let total = 0;
    for (const [level, amount] of Object.entries(amounts)) {
      total += (residents[level] / RESIDENTS_PER_DEMAND) * ((amount / KILOGRAMS_PER_TON) * multiplier);
    }
    demands.set(product, total);
  }
  return demands;
}

/**
 * Demands are shown with one decimal.
 */
const TENTHS = 10;

/**
 * Formats a demand with one decimal, using a decimal comma in German.
 *
 * @param demand - Tons per minute.
 * @param language - The page language.
 * @returns The displayed text; `"0"` marks a product without demand.
 */
export function formatDemand(demand: number, language: Language): string {
  // One decimal, rounded like the old JavaScript.
  const tenths = Math.round(demand * TENTHS);
  const text = (tenths / TENTHS).toString();
  return language === 'de' ? text.replace('.', ',') : text;
}

/**
 * The production building shown for a demand: the first one producing the product.
 */
export interface ProductionRow {
  guid: number;
  product: number;

  /**
   * Output of one building at 100 %.
   */
  tpm: number;
}

/**
 * Lists the production building for every demand, in demand order.
 *
 * @param catalog - The game data.
 * @returns One row per demand.
 */
export function productionRows(catalog: Catalog): ProductionRow[] {
  return catalog.demands.map(({ product }) => {
    const building = catalog.productionBuildingsByProduct.get(product)?.at(0);
    if (!building) throw new Error(`No production building for product ${product}`);
    return { guid: building.guid, product, tpm: tonsPerMinute(building) };
  });
}

/**
 * Needed buildings and their efficiency for a demand.
 */
export interface ProductionResult {
  count: number;
  percent: number;
  efficiencyClass: string;
}

/**
 * Calculates how many buildings a demand needs at a productivity, like the old calculator.
 *
 * @param row - The production row.
 * @param demand - Demand in tons per minute.
 * @param productivityText - The productivity input text in percent.
 * @returns Count, efficiency in percent and its CSS class.
 */
export function calculateProduction(row: ProductionRow, demand: number, productivityText: string): ProductionResult {
  const productivity = filterNum(productivityText) / PERCENT;
  const tpm = row.tpm * productivity;
  const count = Math.ceil(demand / tpm);
  const efficiency = demand / (Math.max(1, count) * tpm);
  const percent = Math.round(efficiency * PERCENT);
  return { count, percent, efficiencyClass: efficiencyClass(percent) };
}
