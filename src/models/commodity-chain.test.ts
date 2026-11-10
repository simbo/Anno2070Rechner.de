import { describe, expect, it } from 'vitest';

import { catalogs } from '../tests/catalogs';
import liveChains from '../tests/live-chains.json';
import { required } from '../tests/required';

import {
  adjustProduction,
  chainGroupView,
  initialAdjustment,
  productionView,
  requestCommodityChain,
  summarizeChain,
  summaryPair,
  type ChainGroupView,
  type ChainRequest,
} from './commodity-chain';

/**
 * The same canonical text form the reference lines were recorded in from the live site.
 *
 * @param group - A level of the chain.
 * @param depth - Its nesting depth.
 * @returns One line per product and building.
 */
function canonical(group: ChainGroupView, depth = 0): string[] {
  const indent = '  '.repeat(depth);
  return [
    `${indent}dt ${group.product.icon} ${group.product.name} ${group.output.kind} ${group.output.value}`,
    ...group.productions.map(
      p =>
        `${indent}  dd ${p.guid} count=${p.count} mult=${p.multiplier} tpm=${p.tpm} need=${p.tpmNeeded} ${p.icon} ${p.name} ` +
        `eff=${p.efficiency}/${p.efficiencyClass} prod=${p.productivity} ` +
        `bc=${p.credits},${p.buildCosts.map(c => `${c.guid}:${c.icon}:${c.name}:${c.value}`).join(',')} ` +
        `mc=${p.maintenance.credits}|${p.maintenance.energy}|${p.maintenance.eco}`,
    ),
    ...group.children.flatMap(child => canonical(child, depth + 1)),
  ];
}

/**
 * Calculates a chain and renders it in the canonical text form.
 *
 * @param language - The language of the names.
 * @param request - The chain request.
 * @returns The canonical lines.
 */
function render(language: 'de' | 'en', request: ChainRequest): string[] {
  const chain = requestCommodityChain(catalogs[language], request);
  if (!chain) throw new Error('unknown building');
  return canonical(chainGroupView(catalogs[language], [chain]));
}

describe('commodity chains', () => {
  it('match the live site for a chain with sub levels and alternatives', () => {
    expect(render('de', { pbGuid: '10156' })).toEqual(liveChains['menuservice-de'].lines);
    expect(render('en', { pbGuid: '10156' })).toEqual(liveChains['menuservice-en'].lines);
  });

  it('match the live site with productivities for every building and a decimal target', () => {
    const productivity = Object.fromEntries(
      [...catalogs.de.productionBuildings.keys()].map(guid => [String(guid), 50 + ((guid * 7) % 251)]),
    );
    expect(render('de', { pbGuid: '10156', tpmNeeded: 7, productivity })).toEqual(
      liveChains['menuservice-all-productivities'].lines,
    );
  });

  it('use the productivity for a count without target, unlike the live site', () => {
    // Two fisheries at 200 % produce 8 t/min; the old site requested only 4 t/min.
    const lines = render('de', { pbGuid: '10045', count: 2, productivity: { 10_045: 200 } });
    expect(lines).not.toEqual(liveChains['fishery-count-productivity'].lines);
    expect(lines[0]).toContain(' tpm 8');
    expect(lines[1]).toContain('count=2 mult=2 tpm=2 need=8 ');
    expect(lines[1]).toContain('eff=100/green prod=200 ');
    const withoutProductivity = render('de', { pbGuid: '10045', count: 2 });
    expect(withoutProductivity[0]).toContain(' tpm 4');
  });

  it('need exactly the requested number of buildings at every productivity', () => {
    for (let productivity = 50; productivity <= 300; productivity++) {
      for (let count = 1; count <= 60; count++) {
        const chain = required(
          requestCommodityChain(catalogs.de, { pbGuid: '10045', count, productivity: { 10_045: productivity } }),
        );
        expect(productionView(catalogs.de, chain).count).toBe(String(count));
      }
    }
  });

  it('need less raw material above 100 %, but not more below, unlike the live site', () => {
    // Tool factories need iron; below 100 % they run slower and use their iron as slowly.
    const iron = (percent: number): number => {
      const chain = required(
        requestCommodityChain(catalogs.de, { pbGuid: '10056', tpmNeeded: 4, productivity: { 10_056: percent } }),
      );
      return required(chain.raw1[0]).target;
    };
    expect(iron(50)).toBe(iron(100));
    expect(iron(200)).toBe(iron(100) / 2);
    const slow = required(
      requestCommodityChain(catalogs.de, { pbGuid: '10056', tpmNeeded: 4, productivity: { 10_056: 50 } }),
    );
    expect(slow.multiplier).toBe(
      2 * required(requestCommodityChain(catalogs.de, { pbGuid: '10056', tpmNeeded: 4 })).multiplier,
    );
  });

  it('do not count a rounding error as a building', () => {
    // 6 × 3.88 t/min divided by 3.88 t/min comes out as 6.000000000000001.
    const request = { pbGuid: '10045', productivity: { 10_045: 194 } };
    const fromCount = required(requestCommodityChain(catalogs.de, { ...request, count: 6 }));
    const fromTarget = required(requestCommodityChain(catalogs.de, { ...request, tpmNeeded: '23.28' }));
    for (const chain of [fromCount, fromTarget]) expect(productionView(catalogs.de, chain).count).toBe('6');
    const view = productionView(catalogs.de, fromCount);
    expect(adjustProduction(view, initialAdjustment(view), '194')).toMatchObject({ count: '6', efficiency: '100' });
  });

  it('show energy and eco output like the live site', () => {
    expect(render('de', { pbGuid: '10050' })).toEqual(liveChains['nuclear-plant-energy'].lines);
    expect(render('de', { pbGuid: '10061' })).toEqual(liveChains['eco-building'].lines);
  });

  it('move a preferred alternative to the front', () => {
    expect(render('de', { pbGuid: '10025', count: 2, preferred: ['10024'] })).toEqual(
      liveChains['coal-plant-preferred'].lines,
    );
    const firstAlternative = (lines: string[]): string =>
      required(lines.find(line => line.startsWith('    dd '))).split(' ', 6)[5];
    expect(firstAlternative(render('de', { pbGuid: '10025', count: 2 }))).toBe('10024');
    expect(firstAlternative(render('de', { pbGuid: '10025', count: 2, preferred: ['10098'] }))).toBe('10098');
  });

  it('parse request values like PHP', () => {
    const decimalComma = render('de', { pbGuid: '10156', tpmNeeded: '2,5' });
    expect(decimalComma[0]).toContain(' tpm 2.5');
    const textCount = render('de', { pbGuid: '10045', count: '3x' });
    expect(textCount[1]).toContain('count=3 ');
    expect(requestCommodityChain(catalogs.de, { pbGuid: 'unknown' })).toBeUndefined();
    expect(requestCommodityChain(catalogs.de, { pbGuid: 1 })).toBeUndefined();
  });
});

describe('adjustProduction', () => {
  const view = productionView(catalogs.de, required(requestCommodityChain(catalogs.de, { pbGuid: '10045', count: 3 })));

  it('recalculates count and efficiency for a new productivity', () => {
    const adjusted = adjustProduction(view, initialAdjustment(view), '150');
    expect(adjusted).toMatchObject({ count: '2', efficiency: '100', changed: true });
    expect(adjusted.credits).toBe('200');
  });

  it('scales costs from the displayed text, including fractions and lost plus signs', () => {
    const state = {
      ...initialAdjustment(view),
      credits: '300',
      maintenance: { credits: '-35 / -14', energy: '+3 / -0', eco: '0 / 0' },
    };
    const adjusted = adjustProduction(view, state, '75');
    expect(adjusted.count).toBe('4');
    expect(adjusted.credits).toBe('400');
    expect(adjusted.maintenance.credits).toBe('-46.666666666666664 / -18.666666666666668');
    expect(adjusted.maintenance.energy).toBe('4 / 0');
  });

  it('keeps the costs when the count stays the same', () => {
    const adjusted = adjustProduction(view, initialAdjustment(view), '101');
    expect(adjusted.changed).toBe(false);
    expect(adjusted.credits).toBe(view.credits);
    expect(adjusted.efficiency).toBe('99');
  });
});

describe('summarizeChain', () => {
  it('sums the active buildings ordered by guid, reading numbers like the old filterNum', () => {
    const chain = required(requestCommodityChain(catalogs.de, { pbGuid: '10156' }));
    const groups = chainGroupView(catalogs.de, [chain]);
    const entries = [groups, ...groups.children].map(group => ({
      view: group.productions[0],
      state: initialAdjustment(group.productions[0]),
    }));
    entries[0].state = {
      ...entries[0].state,
      maintenance: { ...entries[0].state.maintenance, credits: '-46.6 / -15' },
    };
    const summary = summarizeChain(entries);
    expect(summary.productions.map(p => p.guid)).toEqual(
      summary.productions.map(p => p.guid).toSorted((a, b) => a - b),
    );
    expect(summary.buildCosts.map(c => c.guid)).toEqual(summary.buildCosts.map(c => c.guid).toSorted((a, b) => a - b));
    // "-46.6" is read as -466, exactly like the old site.
    expect(summary.maintenance.credits[0]).toBeLessThan(-466);
  });

  it('adds counts of the same building in several levels', () => {
    const view = productionView(
      catalogs.de,
      required(requestCommodityChain(catalogs.de, { pbGuid: '10045', count: 2 })),
    );
    const summary = summarizeChain([
      { view, state: initialAdjustment(view) },
      { view, state: initialAdjustment(view) },
    ]);
    expect(summary.productions).toHaveLength(1);
    expect(summary.productions[0].count).toBe(4);
    expect(summary.credits).toBe(400);
  });

  it('formats maintenance pairs with a plus for gains', () => {
    expect(summaryPair([5, -3])).toBe('+5 / -3');
    expect(summaryPair([0, 2])).toBe('0 / +2');
  });
});
