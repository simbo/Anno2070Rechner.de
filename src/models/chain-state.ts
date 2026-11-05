import {
  adjustProduction,
  chainGroupView,
  initialAdjustment,
  requestCommodityChain,
  summarizeChain,
  type ChainGroupView,
  type ChainRequest,
  type ChainSummary,
  type ProductionAdjustment,
  type ProductionView,
} from './commodity-chain';
import type { Catalog } from './game-data';

/**
 * A displayed building of a chain with its visitor-editable state.
 */
export interface ProductionState {
  view: ProductionView;
  adjustment: ProductionAdjustment;

  /**
   * Text of the productivity input.
   */
  productivity: string;

  /**
   * Whether its productivity slider is shown.
   */
  active: boolean;

  /**
   * Whether the visitor changed its productivity; the old site then dropped a label.
   */
  updated: boolean;
}

/**
 * A displayed level of a chain. The first production is the active one; the others are
 * shown as alternatives.
 */
export interface GroupState {
  view: ChainGroupView;
  productions: ProductionState[];
  children: GroupState[];
}

/**
 * A displayed commodity chain with the behavior of the old site's JavaScript.
 */
export interface ChainState {
  root: GroupState;

  /**
   * Totals, shown when the chain has more than one level or after choosing an alternative.
   */
  summary: ChainSummary | undefined;
}

const createGroup = (view: ChainGroupView): GroupState => ({
  view,
  productions: view.productions.map(production => ({
    view: production,
    adjustment: initialAdjustment(production),
    productivity: production.productivity,
    active: false,
    updated: false,
  })),
  children: view.children.map(child => createGroup(child)),
});

/**
 * All levels in document order: a level, then its sub levels.
 *
 * @param group - The top level.
 * @returns The levels.
 */
export function allGroups(group: GroupState): GroupState[] {
  return [group, ...group.children.flatMap(child => allGroups(child))];
}

/**
 * Sums up the active building of every level.
 *
 * @param state - The chain.
 * @returns The summary.
 */
export function summarize(state: ChainState): ChainSummary {
  return summarizeChain(
    allGroups(state.root).map(group => ({ view: group.productions[0].view, state: group.productions[0].adjustment })),
  );
}

/**
 * Calculates a chain for a request and prepares its display state. The summary is shown
 * right away when the chain has more than one level.
 *
 * @param catalog - The game data.
 * @param request - The chain request.
 * @returns The state, or undefined for an unknown building.
 */
export function createChainState(catalog: Catalog, request: ChainRequest): ChainState | undefined {
  const chain = requestCommodityChain(catalog, request);
  if (!chain) return undefined;
  const state: ChainState = { root: createGroup(chainGroupView(catalog, [chain])), summary: undefined };
  if (allGroups(state.root).length > 1) state.summary = summarize(state);
  return state;
}

/**
 * Makes an alternative the active building of its level and updates the summary.
 *
 * @param state - The chain.
 * @param group - The level.
 * @param production - The alternative to use.
 */
export function chooseAlternative(state: ChainState, group: GroupState, production: ProductionState): void {
  if (group.productions.indexOf(production) <= 0) return;
  group.productions = [production, ...group.productions.filter(other => other !== production)];
  state.summary = summarize(state);
}

/**
 * Applies a productivity input like the old `update` handler.
 *
 * @param production - The building.
 * @param text - The productivity text.
 */
export function updateProductivity(production: ProductionState, text: string): void {
  production.productivity = text;
  production.adjustment = adjustProduction(production.view, production.adjustment, text);
  production.updated = true;
}

/**
 * The request that recalculates a whole chain with the visitor's productivities and chosen
 * alternatives, like the old `updateChildren` handler.
 *
 * @param state - The chain.
 * @returns The request.
 */
export function recalculationRequest(state: ChainState): ChainRequest {
  const productivity: Record<string, string> = {};
  const preferred: number[] = [];
  for (const group of allGroups(state.root)) {
    // Later entries win, as with repeated request parameters in PHP.
    for (const production of group.productions) productivity[String(production.view.guid)] = production.productivity;
    preferred.push(group.productions[0].view.guid);
  }
  const first = state.root.productions[0].view;
  return { pbGuid: first.guid, tpmNeeded: first.tpmNeeded, productivity, preferred };
}

/**
 * What has to happen after a building's slider was closed.
 */
export type ChainFollowUp = 'none' | 'summarize' | 'recalculate';

/**
 * Decides the follow-up after closing a building's slider like the old `updateChildren`
 * handler: chains with sub levels are recalculated, otherwise the summary is updated.
 *
 * @param state - The chain.
 * @param group - The level of the building.
 * @param production - The building.
 * @returns The follow-up.
 */
export function followUp(state: ChainState, group: GroupState, production: ProductionState): ChainFollowUp {
  if (!production.adjustment.changed) return 'none';
  if (group.children.length > 0) return 'recalculate';
  const productions = allGroups(state.root).reduce((total, entry) => total + entry.productions.length, 0);
  return productions > 1 ? 'summarize' : 'none';
}
