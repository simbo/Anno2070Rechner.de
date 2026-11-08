import type { Language } from '../routes';

import { KILOGRAMS_PER_TON, MILLISECONDS_PER_MINUTE, POINT_SCALE } from './units';

/**
 * Kind of a production building, as defined by the old importer.
 */
export type ProductionType = 'farm' | 'factory' | 'eco' | 'energy' | 'forest';

/**
 * Running costs of a building. Eco and energy values use the game's scale of 4096 per point.
 */
export interface Maintenance {
  activeCost: number;
  inactiveCost: number;
  activeEco: number;
  inactiveEco: number;
  activeEnergy: number;
  inactiveEnergy: number;
}

/**
 * A raw material a factory consumes per production cycle, in kilograms.
 */
export interface RawMaterial {
  product: number;
  need: number;
}

/**
 * Any building of the game data.
 */
export interface BuildingData {
  guid: number;
  icon: string;
  credits: number;

  /**
   * Product guid and amount in kilograms, sorted by product guid.
   */
  buildCosts: [number, number][];
  maintenance: Maintenance;
}

/**
 * A building that produces a product, energy or eco balance.
 */
export interface ProductionBuildingData extends BuildingData {
  type: ProductionType;
  product: number;

  /**
   * Duration of one cycle in milliseconds.
   */
  productionTime: number;

  /**
   * Output of one cycle in kilograms.
   */
  productionCount: number;
  raw1: RawMaterial | null;
  raw2: RawMaterial | null;
}

/**
 * Consumption of a product per resident level, in kilograms per 100 residents and minute.
 */
export interface DemandData {
  product: number;
  amounts: Record<string, number>;
}

/**
 * The language-independent game data from `src/data/game-data.json`.
 */
export interface GameData {
  /**
   * Icon file per product guid.
   */
  products: Record<string, string>;

  /**
   * Production buildings in guid order, which decides the default among alternatives.
   */
  productionBuildings: ProductionBuildingData[];

  /**
   * All other buildings in guid order.
   */
  buildings: BuildingData[];

  /**
   * Demands in display order.
   */
  demands: DemandData[];
}

/**
 * Localized names of all game objects by guid.
 */
export type Names = Record<string, string>;

/**
 * A product with its localized name.
 */
export interface Product {
  guid: number;
  icon: string;
  name: string;
}

/**
 * A building with its localized name.
 */
export interface Building extends BuildingData {
  name: string;
}

/**
 * A production building with its localized name and resolved product.
 */
export interface ProductionBuilding extends ProductionBuildingData {
  name: string;
}

/**
 * Game data combined with the names of one language, with lookups by guid.
 */
export interface Catalog {
  language: Language;
  names: Names;
  products: Map<number, Product>;
  productionBuildings: Map<number, ProductionBuilding>;
  buildings: Map<number, Building>;
  demands: DemandData[];

  /**
   * Production buildings per product guid, in guid order.
   */
  productionBuildingsByProduct: Map<number, ProductionBuilding[]>;
}

/**
 * Combines the game data with the names of a language.
 *
 * @param data - The game data.
 * @param names - The names of the language.
 * @param language - The language of the names.
 * @returns The catalog with lookups.
 */
export function createCatalog(data: GameData, names: Names, language: Language): Catalog {
  const name = (guid: number): string => names[String(guid)] ?? '';
  const products = new Map<number, Product>(
    Object.entries(data.products).map(([guid, icon]) => [
      Number(guid),
      { guid: Number(guid), icon, name: name(Number(guid)) },
    ]),
  );
  const productionBuildings = new Map<number, ProductionBuilding>(
    data.productionBuildings.map(building => [building.guid, { ...building, name: name(building.guid) }]),
  );
  const buildings = new Map<number, Building>(
    data.buildings.map(building => [building.guid, { ...building, name: name(building.guid) }]),
  );
  const productionBuildingsByProduct = new Map<number, ProductionBuilding[]>();
  for (const building of productionBuildings.values()) {
    const producers = productionBuildingsByProduct.get(building.product);
    if (producers) producers.push(building);
    else productionBuildingsByProduct.set(building.product, [building]);
  }
  return {
    language,
    names,
    products,
    productionBuildings,
    buildings,
    demands: data.demands,
    productionBuildingsByProduct,
  };
}

/**
 * Loads the game data and the names of a language. Both are separate files with content
 * hashes, so browsers can cache them permanently.
 *
 * @param language - The language of the names.
 * @returns The catalog.
 */
export async function loadCatalog(language: Language): Promise<Catalog> {
  const [data, names] = await Promise.all([
    import('../data/game-data.json').then(module => module.default as unknown as GameData),
    (language === 'en' ? import('../data/names.en.json') : import('../data/names.de.json')).then(
      module => module.default as Names,
    ),
  ]);
  return createCatalog(data, names, language);
}

/**
 * Production cycles per minute.
 *
 * @param building - The production building.
 * @returns The number of cycles per minute.
 */
export const ticksPerMinute = (building: ProductionBuildingData): number =>
  MILLISECONDS_PER_MINUTE / building.productionTime;

/**
 * Output in tons per minute. For energy and eco buildings it is their energy or eco
 * value instead, as on the old site.
 *
 * @param building - The production building.
 * @returns Tons per minute, or energy or eco points.
 */
export function tonsPerMinute(building: ProductionBuildingData): number {
  if (building.type === 'energy') return -(building.maintenance.activeEnergy / POINT_SCALE);
  return building.type === 'eco'
    ? building.maintenance.activeEco / POINT_SCALE
    : (building.productionCount / KILOGRAMS_PER_TON) * ticksPerMinute(building);
}

/**
 * Consumption of a raw material in tons per minute.
 *
 * @param building - The production building.
 * @param raw - One of its raw materials.
 * @returns Tons per minute.
 */
export const rawTonsPerMinute = (building: ProductionBuildingData, raw: RawMaterial): number =>
  (raw.need / KILOGRAMS_PER_TON) * ticksPerMinute(building);
