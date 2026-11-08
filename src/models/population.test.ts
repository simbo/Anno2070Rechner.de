import { describe, expect, it } from 'vitest';

import { catalogs } from '../tests/catalogs';
import { required } from '../tests/required';

import {
  calculateDemands,
  calculateProduction,
  distributeResidences,
  formatDemand,
  levelCount,
  productionRows,
  residenceCapacity,
  residentsFromHouses,
  type Residents,
} from './population';

// Values recorded from the live calculator.
const allGroups: Residents = {
  ecos1: 400,
  ecos2: 1200,
  ecos3: 1800,
  ecos4: 1920,
  tycoons1: 288,
  tycoons2: 870,
  tycoons3: 1300,
  tycoons4: 1360,
  techs1: 180,
  techs2: 1620,
};

describe('distributeResidences', () => {
  it('distributes houses over the allowed levels like the live calculator', () => {
    expect(distributeResidences('ecos', 250, 4)).toEqual([50, 80, 72, 48]);
    expect(distributeResidences('tycoons', 180, 4)).toEqual([36, 58, 52, 34]);
    expect(distributeResidences('techs', 90, 2)).toEqual([36, 54]);
    expect(distributeResidences('ecos', 120, 4)).toEqual([24, 39, 35, 22]);
  });

  it('respects the highest allowed level', () => {
    expect(distributeResidences('ecos', 250, 1)).toEqual([250, 0, 0, 0]);
    expect(distributeResidences('ecos', 100, 2)).toEqual([20, 80, 0, 0]);
    expect(distributeResidences('ecos', 37, 3)).toEqual([8, 12, 17, 0]);
  });

  it('leaves small totals on the lowest level', () => {
    expect(distributeResidences('ecos', 1, 4)).toEqual([1, 0, 0, 0]);
    expect(distributeResidences('techs', 0, 2)).toEqual([0, 0]);
  });
});

describe('residentsFromHouses', () => {
  it('multiplies houses with the capacity per level', () => {
    expect(residentsFromHouses('ecos', [50, 80, 72, 48], false)).toEqual([400, 1200, 1800, 1920]);
    expect(residentsFromHouses('techs', [36, 54], false)).toEqual([180, 1620]);
  });

  it('rounds the living space bonus down per house, as live', () => {
    // 8 × 1.12 = 8.96 and 5 × 1.12 = 5.6 stay 8 and 5.
    expect(residentsFromHouses('ecos', [10, 10, 10, 10], true)).toEqual([80, 160, 280, 440]);
    expect(residentsFromHouses('techs', [10, 10], true)).toEqual([50, 330]);
  });

  it('knows the levels and capacities of each faction', () => {
    expect(levelCount('ecos')).toBe(4);
    expect(levelCount('techs')).toBe(2);
    expect(residenceCapacity('tycoons')).toEqual([8, 15, 25, 40]);
  });
});

describe('calculateDemands and formatDemand', () => {
  it('match the live calculator', () => {
    const demands = calculateDemands(catalogs.de, allGroups, false);
    expect([...demands.values()].map(demand => formatDemand(demand, 'de'))).toEqual([
      '40,4',
      '15,6',
      '17,5',
      '11,8',
      '6',
      '7,2',
      '3,8',
      '2,9',
      '14,6',
      '14,7',
      '8,5',
      '2,9',
      '4,1',
      '3,4',
      '2,7',
      '4,9',
      '6,3',
    ]);
  });

  it('lower lifestyle demands with the second Eco information channel', () => {
    const residents: Residents = {
      ...Object.fromEntries(Object.keys(allGroups).map(key => [key, 0])),
      ecos1: 192,
      ecos2: 585,
      ecos3: 875,
      ecos4: 880,
    };
    const demands = calculateDemands(catalogs.en, residents, true);
    expect([...demands.values()].map(demand => formatDemand(demand, 'en')).slice(0, 9)).toEqual([
      '10',
      '7.5',
      '8.3',
      '4.8',
      '2.9',
      '3.4',
      '1.5',
      '1.1',
      '0',
    ]);
  });

  it('use a decimal comma only in German', () => {
    expect(formatDemand(1.25, 'de')).toBe('1,3');
    expect(formatDemand(1.25, 'en')).toBe('1.3');
    expect(formatDemand(0.04, 'de')).toBe('0');
  });
});

describe('calculateProduction', () => {
  const rows = productionRows(catalogs.de);
  const demands = calculateDemands(catalogs.de, allGroups, false);

  it('lists the first producer of every demand', () => {
    expect(rows.slice(0, 3).map(row => row.guid)).toEqual([10_045, 10_048, 10_176]);
    expect(rows).toHaveLength(catalogs.de.demands.length);
  });

  it('match the live calculator', () => {
    const results = rows.slice(0, 6).map(row => calculateProduction(row, required(demands.get(row.product)), '100'));
    expect(results.map(r => [r.count, r.percent, r.efficiencyClass])).toEqual([
      [21, 96, 'green'],
      [11, 95, 'green'],
      [6, 97, 'green'],
      [6, 98, 'green'],
      [6, 100, 'green'],
      [6, 96, 'green'],
    ]);
  });

  it('use the productivity input', () => {
    const fish = rows[0];
    expect(calculateProduction(fish, 55.1, '150')).toMatchObject({ count: 19, percent: 97 });
  });

  it('produce the class "red" without demand, unlike the live site', () => {
    expect(calculateProduction(rows[0], 0, '100')).toEqual({ count: 0, percent: 0, efficiencyClass: 'red' });
  });
});
