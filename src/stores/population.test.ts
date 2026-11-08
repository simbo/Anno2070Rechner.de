import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import { defaultInputs, parseInputs, storageKey, usePopulationStore } from './population';

const { localStorage } = globalThis;

describe('parseInputs', () => {
  it('falls back to the defaults of the old calculator', () => {
    const defaults = defaultInputs();
    expect(parseInputs(null)).toEqual(defaults);
    expect(parseInputs('not json')).toEqual(defaults);
    expect(parseInputs('{"residences":{}}')).toEqual(defaults);
    expect(defaults.maxUpgrade).toEqual({ ecos: '4', tycoons: '4', techs: '2' });
    expect(defaults.show).toEqual({ residences: true, inhabitants: false, demands: false, production: true });
    expect(defaults.residences.techs).toHaveLength(3);
  });

  it('accepts complete stored inputs', () => {
    const inputs = defaultInputs();
    inputs.residences.ecos = ['10', '2', '3', '4', '1'];
    inputs.info.ecos = '2';
    inputs.productivity['10045'] = '150';
    inputs.chains['10186'] = { productivity: { '10024': '150' }, preferred: [10_186, 10_024] };
    expect(parseInputs(JSON.stringify(inputs))).toEqual(inputs);
  });

  it('keeps inputs that were saved before chains had settings', () => {
    const { chains, ...older } = { ...defaultInputs(), ccTarget: '1' };
    expect(chains).toEqual({});
    expect(parseInputs(JSON.stringify(older))).toMatchObject({ ccTarget: '1', chains: {} });
  });

  it('rejects invalid chain settings', () => {
    const inputs = { ...defaultInputs(), ccTarget: '1', chains: { '10186': { productivity: 'x', preferred: [] } } };
    expect(parseInputs(JSON.stringify(inputs))).toEqual(defaultInputs());
  });

  it('rejects inputs with a wrong number of levels or unknown values', () => {
    const inputs = defaultInputs();
    expect(parseInputs(JSON.stringify({ ...inputs, residences: { ...inputs.residences, techs: ['0', '0'] } }))).toEqual(
      defaultInputs(),
    );
    expect(parseInputs(JSON.stringify({ ...inputs, ccTarget: '2' }))).toEqual(defaultInputs());
  });
});

describe('usePopulationStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('saves changes in the browser', async () => {
    const store = usePopulationStore();
    store.inputs.residences.ecos[0] = '42';
    await nextTick();
    const stored = parseInputs(localStorage.getItem(storageKey));
    expect(stored.residences.ecos[0]).toBe('42');
  });

  it('restores saved inputs', () => {
    const inputs = defaultInputs();
    inputs.ccTarget = '1';
    localStorage.setItem(storageKey, JSON.stringify(inputs));
    expect(usePopulationStore().inputs.ccTarget).toBe('1');
  });
});
