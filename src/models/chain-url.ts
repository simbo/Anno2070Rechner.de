import { filterNum } from '../lib/legacy';

import type { ChainSettings } from './chain-state';
import type { Catalog } from './game-data';
import { PERCENT } from './units';

const MAX_PRODUCTIVITY = 999;

/**
 * Reads the productivities of a chain from the URL parameter `prod`, for example
 * `10037:150,10042:50`. Unknown buildings and invalid values are left out.
 *
 * @param catalog - The game data.
 * @param text - The parameter.
 * @returns The productivities per building guid.
 */
export function parseProductivities(catalog: Catalog, text: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  const entries = (text ?? '').split(',');
  for (const entry of entries) {
    const [guid, value] = entry.split(':', 2);
    const percent = Number(value);
    if (!catalog.productionBuildings.has(Number(guid))) continue;
    if (Number.isSafeInteger(percent) && percent >= 1 && percent <= MAX_PRODUCTIVITY) result[guid] = String(percent);
  }
  return result;
}

/**
 * Writes productivities for the URL parameter `prod`. A productivity of 100 % is the default
 * and stays out of the URL.
 *
 * @param productivity - The productivities per building guid.
 * @returns The parameter, or undefined without any.
 */
export function formatProductivities(productivity: Record<string, string>): string | undefined {
  const entries = Object.keys(productivity)
    .filter(guid => filterNum(productivity[guid]) !== PERCENT)
    .sort((a, b) => a.localeCompare(b))
    .map(guid => `${guid}:${filterNum(productivity[guid])}`);
  return entries.length > 0 ? entries.join(',') : undefined;
}

/**
 * Reads the chosen alternatives from the URL parameter `alt`, for example `10050,10098`.
 *
 * @param catalog - The game data.
 * @param text - The parameter.
 * @returns The guids of known buildings.
 */
export const parseAlternatives = (catalog: Catalog, text: string | undefined): number[] =>
  (text ?? '')
    .split(',')
    .map(Number)
    .filter(guid => catalog.productionBuildings.has(guid));

/**
 * Writes chosen alternatives for the URL parameter `alt`. The first producer of a product is
 * the default and stays out of the URL.
 *
 * @param catalog - The game data.
 * @param preferred - The active building of every level.
 * @returns The parameter, or undefined without any.
 */
export function formatAlternatives(catalog: Catalog, preferred: readonly number[]): string | undefined {
  const alternatives = preferred.filter(guid => {
    const building = catalog.productionBuildings.get(guid);
    return building && catalog.productionBuildingsByProduct.get(building.product)?.[0].guid !== guid;
  });
  return alternatives.length > 0 ? alternatives.join(',') : undefined;
}

/**
 * Reads what a chain's URL says about its settings.
 *
 * @param catalog - The game data.
 * @param prod - The parameter `prod`.
 * @param alt - The parameter `alt`.
 * @returns The settings.
 */
export const parseChainUrl = (catalog: Catalog, prod: string | undefined, alt: string | undefined): ChainSettings => ({
  productivity: parseProductivities(catalog, prod),
  preferred: parseAlternatives(catalog, alt),
});
