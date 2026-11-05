import { phpNumber, phpRound } from '../lib/php';

import {
  rawTonsPerMinute,
  tonsPerMinute,
  type BuildingData,
  type Catalog,
  type Product,
  type ProductionBuilding,
} from './game-data';
import { KILOGRAMS_PER_TON, POINT_SCALE } from './units';

/**
 * A product icon with its localized name and a displayed value.
 */
export interface IconItem {
  guid: number;
  icon: string;
  name: string;

  /**
   * Displayed value.
   */
  value: string;
}

/**
 * Maintenance texts like `-120 / -60` for active and inactive state.
 */
export interface MaintenanceTexts {
  credits: string;
  energy: string;
  eco: string;
}

const signed = (value: number, positive: boolean): string => `${positive ? '+' : ''}${phpNumber(value)}`;

/**
 * Formats the maintenance of a number of buildings like the old PHP output. Credits and
 * energy are shown as income (negated), eco balance as is; a plus marks gains.
 *
 * PHP keeps integer arithmetic when a division is exact, so the database view (integer
 * count) never shows `-0` for exact values, while chains (rounded-up float count) do.
 *
 * @param building - The building.
 * @param count - Number of buildings.
 * @param floatCount - Whether the count is a float in PHP, as in commodity chains.
 * @returns The texts.
 */
export function maintenanceTexts(building: BuildingData, count: number, floatCount: boolean): MaintenanceTexts {
  const m = building.maintenance;
  // In PHP, integer results cannot be negative zero.
  const integer = (value: number, exact: boolean): number => (!floatCount && exact && value === 0 ? 0 : value);
  const scaled = (value: number, sign: number): number =>
    integer(phpRound((value / POINT_SCALE) * count * sign), Number.isSafeInteger(value / POINT_SCALE));
  const energy = (value: number): string => signed(scaled(value, -1), value < 0);
  const eco = (value: number): string => signed(scaled(value, 1), value > 0);
  const credits = (value: number): string => signed(integer(-(value * count), true), value < 0);
  return {
    credits: `${credits(m.activeCost)} / ${credits(m.inactiveCost)}`,
    energy: `${energy(m.activeEnergy)} / ${energy(m.inactiveEnergy)}`,
    eco: `${eco(m.activeEco)} / ${eco(m.inactiveEco)}`,
  };
}

/**
 * Build costs of a number of buildings in tons, like the old PHP output.
 *
 * @param catalog - The game data.
 * @param building - The building.
 * @param count - Number of buildings.
 * @returns One item per product.
 */
export function buildCostItems(catalog: Catalog, building: BuildingData, count: number): IconItem[] {
  return building.buildCosts.map(([guid, amount]) => {
    const product = catalog.products.get(guid);
    return {
      guid,
      icon: product?.icon ?? '',
      name: product?.name ?? '',
      value: phpNumber(phpRound(amount / KILOGRAMS_PER_TON) * count),
    };
  });
}

/**
 * Production details of a building in the database view.
 */
export interface ProductionDetails {
  /**
   * Output, rounded to two decimals.
   */
  tpm: string;

  /**
   * Whether the output is shown in tons per minute (not for energy and eco).
   */
  inTons: boolean;
  product: Product | undefined;
  raws: { tpm: string; product: Product | undefined }[];
}

/**
 * Display values of a building in the database view, like the old `GameData::drawBuilding()`.
 */
export interface BuildingView {
  guid: number;
  icon: string;
  name: string;
  production?: ProductionDetails;
  credits: string;
  buildCosts: IconItem[];
  maintenance: MaintenanceTexts;
}

/**
 * Builds the display values of a building for the database view.
 *
 * @param catalog - The game data.
 * @param building - The building or production building.
 * @returns The display values.
 */
export function buildingView(catalog: Catalog, building: BuildingData & { name: string }): BuildingView {
  const view: BuildingView = {
    guid: building.guid,
    icon: building.icon,
    name: building.name,
    credits: phpNumber(building.credits),
    buildCosts: buildCostItems(catalog, building, 1),
    maintenance: maintenanceTexts(building, 1, false),
  };
  if ('product' in building) {
    const production = building as ProductionBuilding;
    view.production = {
      tpm: phpNumber(phpRound(tonsPerMinute(production), 2)),
      inTons: production.type !== 'energy' && production.type !== 'eco',
      product: catalog.products.get(production.product),
      raws: [production.raw1, production.raw2]
        .filter(raw => raw !== null)
        .map(raw => ({
          tpm: phpNumber(phpRound(rawTonsPerMinute(production, raw), 2)),
          product: catalog.products.get(raw.product),
        })),
    };
  }
  return view;
}
