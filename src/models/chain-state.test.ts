import { describe, expect, it } from 'vitest';

import { catalogs } from '../tests/catalogs';
import { required } from '../tests/required';

import {
  allGroups,
  chainSettings,
  chooseAlternative,
  createChainState,
  followUp,
  recalculationRequest,
  summarize,
  updateProductivity,
  type ChainState,
} from './chain-state';

// Electronics have an alternative copper producer in their chain.
const menu = (): ChainState => required(createChainState(catalogs.de, { pbGuid: '10186' }));

describe('chain state', () => {
  it('shows a summary only for chains with several levels', () => {
    expect(menu().summary).toBeDefined();
    expect(required(createChainState(catalogs.de, { pbGuid: '10045' })).summary).toBeUndefined();
    expect(createChainState(catalogs.de, { pbGuid: 'x' })).toBeUndefined();
  });

  it('makes a chosen alternative active and updates the summary', () => {
    const state = menu();
    const group = required(allGroups(state.root).find(entry => entry.productions.length > 1));
    const alternative = group.productions[1];
    const before = summarize(state);
    chooseAlternative(state, group, alternative);
    expect(group.productions[0]).toBe(alternative);
    expect(state.summary).not.toEqual(before);
    chooseAlternative(state, group, alternative);
    expect(group.productions[0]).toBe(alternative);
  });

  it('marks a building changed when its count changes', () => {
    const state = menu();
    const production = state.root.productions[0];
    updateProductivity(production, '50');
    expect(production).toMatchObject({ productivity: '50', updated: true });
    expect(production.adjustment).toMatchObject({ count: '2', changed: true });
  });

  it('recalculates chains with sub levels and summarizes otherwise', () => {
    const state = menu();
    const root = state.root.productions[0];
    expect(followUp(state, state.root, root)).toBe('none');
    updateProductivity(root, '50');
    expect(followUp(state, state.root, root)).toBe('recalculate');

    const leafGroup = required(allGroups(state.root).find(group => group.children.length === 0));
    const leaf = leafGroup.productions[0];
    updateProductivity(leaf, '1');
    expect(followUp(state, leafGroup, leaf)).toBe('summarize');

    const single = required(createChainState(catalogs.de, { pbGuid: '10045' }));
    updateProductivity(single.root.productions[0], '50');
    expect(followUp(single, single.root, single.root.productions[0])).toBe('none');
  });

  it('builds the recalculation request from all inputs and active buildings', () => {
    const state = menu();
    const group = required(allGroups(state.root).find(entry => entry.productions.length > 1));
    chooseAlternative(state, group, group.productions[1]);
    updateProductivity(state.root.productions[0], '150');
    const request = recalculationRequest(state);
    expect(request).toMatchObject({ pbGuid: 10_186, tpmNeeded: '2' });
    expect(required(request.productivity)['10186']).toBe('150');
    expect(request.preferred).toContain(group.productions[0].view.guid);
    expect(request.preferred).toHaveLength(allGroups(state.root).length);
  });

  it('collects chain settings without the top building and without default productivities', () => {
    const state = menu();
    expect(chainSettings(state).productivity).toEqual({});
    const group = required(allGroups(state.root).find(entry => entry.productions.length > 1));
    const alternative = group.productions[1];
    chooseAlternative(state, group, alternative);
    updateProductivity(state.root.productions[0], '150');
    updateProductivity(alternative, '200');
    const settings = chainSettings(state);
    expect(settings.productivity).toEqual({ [alternative.view.guid]: '200' });
    expect(settings.preferred).toContain(alternative.view.guid);
  });

  it('restores chain settings in a new chain', () => {
    const state = menu();
    const group = required(allGroups(state.root).find(entry => entry.productions.length > 1));
    const alternative = group.productions[1];
    chooseAlternative(state, group, alternative);
    updateProductivity(alternative, '200');
    const restored = required(createChainState(catalogs.de, { pbGuid: '10186', ...chainSettings(state) }));
    const active = required(allGroups(restored.root).find(entry => entry.productions.length > 1)).productions[0];
    expect(active.view.guid).toBe(alternative.view.guid);
    expect(active.productivity).toBe('200');
  });
});
