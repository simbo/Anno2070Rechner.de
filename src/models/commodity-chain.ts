import { filterNum, parseLeadingInt } from '../lib/legacy';
import { phpFloatval, phpIntval, phpNumber, phpRound } from '../lib/php';

import { buildCostItems, maintenanceTexts, type IconItem, type MaintenanceTexts } from './building-view';
import { rawTonsPerMinute, tonsPerMinute, type Catalog, type ProductionBuilding } from './game-data';
import { buildingCount, PERCENT } from './units';

export type { IconItem } from './building-view';

/**
 * One building in a commodity chain, as calculated by the old `GameData::getCommodityChain()`.
 */
export interface ChainNode {
  building: ProductionBuilding;

  /**
   * Needed number of buildings, not rounded.
   */
  multiplier: number;

  /**
   * Needed output in tons per minute (or energy or eco points).
   */
  target: number;

  /**
   * Productivity as a factor, 1 for 100 %.
   */
  productivity: number;

  /**
   * Alternatives producing the first raw material; the first one is used.
   */
  raw1: ChainNode[];

  /**
   * Alternatives producing the second raw material; the first one is used.
   */
  raw2: ChainNode[];
}

/**
 * Productivity in percent per production building guid.
 */
export type Productivities = Partial<Record<number, number>>;

/**
 * Calculates a commodity chain recursively like the old `GameData::getCommodityChain()`.
 * For every raw material, all buildings producing it are listed; a preferred building
 * moves to the front, otherwise the order of the game data applies.
 *
 * @param catalog - The game data.
 * @param building - The building at the top of the chain.
 * @param count - Number of buildings, only used without a target.
 * @param target - Needed output, or null for the output of `count` buildings.
 * @param productivity - Productivity in percent per building guid.
 * @param preferred - Guids of buildings to prefer among alternatives.
 * @returns The chain.
 */
export function getCommodityChain(
  catalog: Catalog,
  building: ProductionBuilding,
  count: number,
  target: number | null,
  productivity: Productivities,
  preferred: readonly number[],
): ChainNode {
  const percent = productivity[building.guid];
  const factor = percent === undefined ? 1 : percent / PERCENT;
  const tpm = tonsPerMinute(building);
  const targetTpm = target ?? tpm * factor * Math.trunc(count);
  const multiplier = targetTpm / (tpm * factor);
  const node: ChainNode = { building, multiplier, target: targetTpm, productivity: factor, raw1: [], raw2: [] };
  for (const key of ['raw1', 'raw2'] as const) {
    const raw = building[key];
    if (!raw) continue;
    const producers = preferFirst(catalog.productionBuildingsByProduct.get(raw.product) ?? [], preferred);
    const needed = rawTonsPerMinute(building, raw) * multiplier;
    node[key] = producers.map(producer => getCommodityChain(catalog, producer, 1, needed, productivity, preferred));
  }
  return node;
}

/**
 * Moves the first preferred building to the front, keeping the order of the others.
 *
 * @param producers - The buildings producing a raw material, in game data order.
 * @param preferred - Guids of preferred buildings.
 * @returns The ordered buildings.
 */
function preferFirst(
  producers: readonly ProductionBuilding[],
  preferred: readonly number[],
): readonly ProductionBuilding[] {
  const index = producers.findIndex(producer => preferred.includes(producer.guid));
  return index > 0 ? [producers[index], ...producers.slice(0, index), ...producers.slice(index + 1)] : producers;
}

/**
 * Parameters of a chain request, named like the old `get-commoditychain` request.
 * Values may be text, as they were sent by the browser.
 */
export interface ChainRequest {
  pbGuid: number | string;
  count?: number | string;
  tpmNeeded?: number | string;
  productivity?: Record<string, number | string>;
  preferred?: readonly (number | string)[];
}

/**
 * Answers a chain request like the old `tpl/get-commoditychain.php`. Without a target,
 * the output of `count` buildings at their productivity is used. The live site ignored
 * that productivity; this was fixed in commit `f78cae1`, which never ran live.
 *
 * @param catalog - The game data.
 * @param request - The request parameters.
 * @returns The chain, or undefined for an unknown building.
 */
export function requestCommodityChain(catalog: Catalog, request: ChainRequest): ChainNode | undefined {
  const building = catalog.productionBuildings.get(phpIntval(request.pbGuid));
  if (!building) return undefined;
  const count = request.count === undefined ? 1 : phpIntval(request.count);
  const productivity: Productivities = {};
  if (request.productivity != undefined) {
    for (const [guid, value] of Object.entries(request.productivity)) productivity[Number(guid)] = phpIntval(value);
  }
  const preferred = (request.preferred ?? []).map(guid => phpIntval(guid));
  const requested = request.tpmNeeded === undefined ? 0 : phpFloatval(String(request.tpmNeeded).replaceAll(',', '.'));
  const output = tonsPerMinute(building) * ((productivity[building.guid] ?? PERCENT) / PERCENT) * count;
  const target = requested > 0 ? requested : output;
  return getCommodityChain(catalog, building, 1, target, productivity, preferred);
}

/**
 * Display values of one building in a chain, like the old `GameData::drawProduction()`.
 * Text values are formatted exactly like the old PHP output.
 */
export interface ProductionView {
  guid: number;
  icon: string;
  name: string;

  /**
   * `data-count`: needed buildings, rounded up.
   */
  count: string;

  /**
   * `data-multiplier`.
   */
  multiplier: string;

  /**
   * `data-tpm`: output of one building at 100 %.
   */
  tpm: string;

  /**
   * `data-tpm-needed`.
   */
  tpmNeeded: string;
  efficiency: string;
  efficiencyClass: string;

  /**
   * Productivity in percent.
   */
  productivity: string;
  credits: string;
  buildCosts: IconItem[];

  /**
   * Maintenance texts like `-120 / -60`.
   */
  maintenance: MaintenanceTexts;
}

/**
 * Display values of one level of a chain: the product and its alternative buildings,
 * like a `dl.chain` of the old `GameData::drawCommodityChain()`.
 */
export interface ChainGroupView {
  product: { icon: string; name: string };
  output: { kind: 'tpm' | 'energy' | 'eco'; value: string };
  productions: ProductionView[];

  /**
   * The levels below, for all alternatives in order.
   */
  children: ChainGroupView[];
}

/**
 * Efficiency classes of the old PHP output with their lower limits in percent.
 */
const efficiencyLimits = { green: 80, lightgreen: 60, yellow: 40, orange: 20 };

const phpEfficiencyClass = (efficiency: number): string =>
  Object.entries(efficiencyLimits).find(([, limit]) => efficiency > limit)?.[0] ?? 'red';

/**
 * Builds the display values of one building like the old `GameData::drawProduction()`.
 *
 * @param catalog - The game data.
 * @param node - The chain node.
 * @returns The display values.
 */
export function productionView(catalog: Catalog, node: ChainNode): ProductionView {
  const { building, multiplier, productivity, target } = node;
  const count = buildingCount(multiplier);
  const efficiency = phpRound((multiplier / count) * PERCENT);
  return {
    guid: building.guid,
    icon: building.icon,
    name: building.name,
    count: phpNumber(count),
    multiplier: phpNumber(multiplier),
    tpm: phpNumber(tonsPerMinute(building)),
    tpmNeeded: phpNumber(target),
    efficiency: phpNumber(efficiency),
    efficiencyClass: phpEfficiencyClass(efficiency),
    productivity: phpNumber(phpRound(productivity * PERCENT)),
    credits: phpNumber(building.credits * count),
    buildCosts: buildCostItems(catalog, building, count),
    maintenance: maintenanceTexts(building, count, true),
  };
}

/**
 * Builds the display tree of a chain like the old `GameData::drawCommodityChain()`.
 *
 * @param catalog - The game data.
 * @param nodes - The alternatives of one level; the first one decides product and output.
 * @returns The display tree.
 */
export function chainGroupView(catalog: Catalog, nodes: readonly ChainNode[]): ChainGroupView {
  const first = nodes[0];
  const product = catalog.products.get(first.building.product);
  const kind = first.building.type === 'energy' ? 'energy' : first.building.type === 'eco' ? 'eco' : 'tpm';
  return {
    product: { icon: product?.icon ?? '', name: product?.name ?? '' },
    output: { kind, value: phpNumber(kind === 'eco' ? first.target : phpRound(first.target, 1)) },
    productions: nodes.map(node => productionView(catalog, node)),
    children: nodes.flatMap(node => [
      ...(node.raw1.length > 0 ? [chainGroupView(catalog, node.raw1)] : []),
      ...(node.raw2.length > 0 ? [chainGroupView(catalog, node.raw2)] : []),
    ]),
  };
}

/**
 * Display state of a building after the visitor changed its productivity, like the
 * old client-side `update` handler. Values are recalculated from the displayed text, so
 * rounding and formatting follow the old JavaScript.
 */
export interface ProductionAdjustment {
  count: string;
  efficiency: string;
  credits: string;
  buildCosts: string[];
  maintenance: MaintenanceTexts;

  /**
   * Whether the number of buildings differs from the calculated one.
   */
  changed: boolean;
}

/**
 * Recalculates a building's display values for a new productivity like the old
 * JavaScript: count and efficiency from the data attributes, costs scaled from their
 * displayed text.
 *
 * @param view - The calculated display values.
 * @param current - The currently displayed values.
 * @param productivityText - The productivity input text.
 * @returns The new display values.
 */
export function adjustProduction(
  view: ProductionView,
  current: ProductionAdjustment,
  productivityText: string,
): ProductionAdjustment {
  const tpm = Number(view.tpm);
  const tpmNeeded = Number(view.tpmNeeded);
  const productivity = filterNum(productivityText) / PERCENT;
  const exact = tpmNeeded / (tpm * productivity);
  const count = buildingCount(exact);
  const efficiency = Math.round((exact / count) * PERCENT).toString();
  const originalCount = parseLeadingInt(current.count);
  const next: ProductionAdjustment = { ...current, count: count.toString(), efficiency };
  if (originalCount !== count) {
    const scale = (text: string): string => ((parseLeadingInt(text) / originalCount) * count).toString();
    const scalePair = (text: string): string => {
      const [left, right] = text.split('/', 2);
      return `${scale(left)} / ${scale(right)}`;
    };
    next.credits = scale(current.credits);
    next.buildCosts = current.buildCosts.map(text => scale(text));
    next.maintenance = {
      credits: scalePair(current.maintenance.credits),
      energy: scalePair(current.maintenance.energy),
      eco: scalePair(current.maintenance.eco),
    };
    next.changed = true;
  }
  return next;
}

/**
 * The initial display state of a building.
 *
 * @param view - The calculated display values.
 * @returns The display state.
 */
export const initialAdjustment = (view: ProductionView): ProductionAdjustment => ({
  count: view.count,
  efficiency: view.efficiency,
  credits: view.credits,
  buildCosts: view.buildCosts.map(cost => cost.value),
  maintenance: { ...view.maintenance },
  changed: false,
});

/**
 * Totals of a chain, like the old client-side `summarize` handler. It reads the
 * displayed values of the first (active) building of every level.
 */
export interface ChainSummary {
  productions: { guid: number; icon: string; name: string; count: number }[];
  credits: number;
  buildCosts: { guid: number; icon: string; name: string; value: number }[];
  maintenance: { credits: [number, number]; energy: [number, number]; eco: [number, number] };
}

/**
 * Input for the summary: the active building of one level and its displayed values.
 */
export interface SummaryEntry {
  view: ProductionView;
  state: ProductionAdjustment;
}

/**
 * Sums up the active buildings of all levels like the old `summarize` handler.
 * Buildings and products are ordered by guid, as JavaScript orders numeric object keys.
 *
 * @param entries - The active building of each level with its displayed values.
 * @returns The summary.
 */
export function summarizeChain(entries: readonly SummaryEntry[]): ChainSummary {
  const productions = new Map<number, ChainSummary['productions'][number]>();
  const products = new Map<number, ChainSummary['buildCosts'][number]>();
  const maintenance: ChainSummary['maintenance'] = { credits: [0, 0], energy: [0, 0], eco: [0, 0] };
  let credits = 0;
  for (const { view, state } of entries) {
    const count = filterNum(state.count);
    const production = productions.get(view.guid);
    if (production) production.count += count;
    else productions.set(view.guid, { guid: view.guid, icon: view.icon, name: view.name, count });
    credits += filterNum(state.credits.trim());
    for (const [index, cost] of view.buildCosts.entries()) {
      const value = filterNum(state.buildCosts[index].trim());
      const product = products.get(cost.guid);
      if (product) product.value += value;
      else products.set(cost.guid, { guid: cost.guid, icon: cost.icon, name: cost.name, value });
    }
    for (const key of ['credits', 'energy', 'eco'] as const) {
      const [left, right] = state.maintenance[key].split('/', 2);
      maintenance[key][0] += filterNum(left.trim());
      maintenance[key][1] += filterNum(right.trim());
    }
  }
  const byGuid = <T extends { guid: number }>(items: Iterable<T>): T[] =>
    [...items].toSorted((a, b) => a.guid - b.guid);
  return { productions: byGuid(productions.values()), credits, buildCosts: byGuid(products.values()), maintenance };
}

/**
 * Formats a summary maintenance pair like the old summary: positive values get a plus.
 *
 * @param pair - Active and inactive value.
 * @returns The text, like `+5 / -3`.
 */
export function summaryPair(pair: [number, number]): string {
  const [active, inactive] = pair;
  return `${active > 0 ? '+' : ''}${active} / ${inactive > 0 ? '+' : ''}${inactive}`;
}
