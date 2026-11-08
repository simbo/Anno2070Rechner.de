import { phpIntval, phpStrnatcasecmp } from '../lib/php';

import type { Building, Catalog, Product, ProductionBuilding } from './game-data';

/**
 * Parameters of the database view, named like the old URL parameters.
 */
export interface DatabaseQuery {
  search?: string;
  productionbuilding?: string;
  building?: string;
  product?: string;
}

/**
 * Results of the database view, each list sorted by name.
 */
export interface DatabaseResults {
  productionBuildings: ProductionBuilding[];
  buildings: Building[];
  products: Product[];
}

/**
 * Normalizes a search text like the old site: PHP's `strtolower()` only lowercases ASCII
 * letters, then Ö, Ä and Ü are lowercased explicitly.
 *
 * @param text - The entered text.
 * @returns The text to search for.
 */
export function searchText(text: string): string {
  return text
    .replace(/[A-Z]/g, letter => letter.toLowerCase())
    .replace(/Ö/g, 'ö')
    .replace(/Ä/g, 'ä')
    .replace(/Ü/g, 'ü');
}

/**
 * Whether PHP's `empty()` treats a text as empty: also true for `"0"`.
 *
 * @param text - The text.
 * @returns True if empty.
 */
const phpEmpty = (text: string): boolean => text === '' || text === '0';

const byName = <T extends { name: string }>(a: T, b: T): number => phpStrnatcasecmp(a.name, b.name);

const matches = (name: string, text: string): boolean => name.toLowerCase().includes(text);

const addUnique = <T>(list: T[], item: T | undefined): void => {
  if (item && !list.includes(item)) list.push(item);
};

/**
 * Production buildings shown for the `productionbuilding` parameter: all, all of a type,
 * or a single one.
 *
 * @param catalog - The game data.
 * @param filter - The parameter value.
 * @param found - Results found so far, kept unless "all" replaces them.
 * @returns The production buildings.
 */
function selectProductionBuildings(
  catalog: Catalog,
  filter: string,
  found: ProductionBuilding[],
): ProductionBuilding[] {
  const all = [...catalog.productionBuildings.values()];
  if (filter === 'all') return all;
  const result = [...found];
  if (['factory', 'farm', 'energy', 'eco'].includes(filter)) {
    result.push(...all.filter(entry => entry.type === filter && !result.includes(entry)));
  } else addUnique(result, catalog.productionBuildings.get(phpIntval(filter)));
  return result;
}

/**
 * Entries shown for the `building` or `product` parameter: all or a single one.
 *
 * @param entries - All entries by guid.
 * @param filter - The parameter value.
 * @param found - Results found so far, kept unless "all" replaces them.
 * @returns The entries.
 */
function selectEntries<T>(entries: Map<number, T>, filter: string, found: T[]): T[] {
  if (filter === 'all') return [...entries.values()];
  const result = [...found];
  addUnique(result, entries.get(phpIntval(filter)));
  return result;
}

/**
 * Entries whose name contains a text.
 *
 * @param entries - The entries.
 * @param text - The normalized search text.
 * @returns The matching entries.
 */
const searchIn = <T extends { name: string }>(entries: Iterable<T>, text: string): T[] =>
  [...entries].filter(entry => matches(entry.name, text));

/**
 * Finds the database results like the old `tpl/database.php`: search results first,
 * then the selected production buildings, buildings and products. "all" replaces the
 * respective list.
 *
 * @param catalog - The game data.
 * @param query - The query parameters.
 * @returns The sorted results.
 */
export function databaseResults(catalog: Catalog, query: DatabaseQuery): DatabaseResults {
  const text = query.search === undefined ? '' : searchText(query.search);
  const search = !phpEmpty(text);
  let productionBuildings = search ? searchIn(catalog.productionBuildings.values(), text) : [];
  let buildings = search ? searchIn(catalog.buildings.values(), text) : [];
  let products = search ? searchIn(catalog.products.values(), text) : [];
  if (query.productionbuilding !== undefined) {
    productionBuildings = selectProductionBuildings(catalog, query.productionbuilding, productionBuildings);
  }
  if (query.building !== undefined) buildings = selectEntries(catalog.buildings, query.building, buildings);
  if (query.product !== undefined) products = selectEntries(catalog.products, query.product, products);
  return {
    productionBuildings: [...productionBuildings].sort(byName),
    buildings: [...buildings].sort(byName),
    products: [...products].sort(byName),
  };
}

/**
 * A suggestion of the commodity chain search: the name of a production building.
 */
export interface ProductionSuggestion {
  name: string;
  guid: number;
}

/**
 * Suggestions for the commodity chain search like the old `search-autocomplete` with
 * `type=production`: production buildings whose name contains the text, and the
 * producers of products whose name contains it.
 *
 * @param catalog - The game data.
 * @param input - The entered text.
 * @returns Suggestions sorted by name.
 */
export function productionSuggestions(catalog: Catalog, input: string): ProductionSuggestion[] {
  const text = searchText(input);
  if (phpEmpty(text)) return [];
  const results = new Map<number, ProductionSuggestion>();
  for (const building of catalog.productionBuildings.values()) {
    if (matches(building.name, text) && !results.has(building.guid)) {
      results.set(building.guid, { name: building.name, guid: building.guid });
    }
  }
  for (const [product, producers] of catalog.productionBuildingsByProduct) {
    if (!matches(catalog.names[String(product)] ?? '', text)) continue;
    for (const producer of producers) {
      if (!results.has(producer.guid)) results.set(producer.guid, { name: producer.name, guid: producer.guid });
    }
  }
  return [...results.values()].sort(byName);
}

/**
 * Suggestions for the database search like the old `search-autocomplete`: names of all
 * game objects that start with the text, without duplicates.
 *
 * @param catalog - The game data.
 * @param input - The entered text.
 * @returns Names sorted naturally.
 */
export function nameSuggestions(catalog: Catalog, input: string): string[] {
  const text = searchText(input);
  if (phpEmpty(text)) return [];
  const names = new Set<string>();
  for (const name of Object.values(catalog.names)) if (name.toLowerCase().startsWith(text)) names.add(name);
  return [...names].sort(phpStrnatcasecmp);
}
