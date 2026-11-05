import { describe, expect, it } from 'vitest';

import { catalogs } from '../tests/catalogs';
import { required } from '../tests/required';

import { buildCostItems, buildingView, maintenanceTexts } from './building-view';
import type { BuildingData } from './game-data';

const base: BuildingData = {
  guid: 1,
  icon: 'icon.png',
  credits: 100,
  buildCosts: [[2_500_001, 2500]],
  maintenance: {
    activeCost: 5,
    inactiveCost: 0,
    activeEco: 1638,
    inactiveEco: 0,
    activeEnergy: 4096,
    inactiveEnergy: 0,
  },
};

describe('maintenanceTexts', () => {
  it('shows exact integer results without negative zero in the database view', () => {
    expect(maintenanceTexts(base, 1, false)).toEqual({ credits: '-5 / 0', energy: '-1 / 0', eco: '+0 / 0' });
  });

  it('shows negative zero for float results in chains, like PHP', () => {
    expect(maintenanceTexts(base, 1, true)).toEqual({ credits: '-5 / -0', energy: '-1 / -0', eco: '+0 / 0' });
  });

  it('marks income and eco gains with a plus', () => {
    const producer = {
      ...base,
      maintenance: { ...base.maintenance, activeCost: -10, activeEnergy: -8192, activeEco: 8192 },
    };
    expect(maintenanceTexts(producer, 2, true)).toEqual({ credits: '+20 / -0', energy: '+4 / -0', eco: '+4 / 0' });
  });
});

describe('buildCostItems', () => {
  it('converts kilograms to rounded tons per building count', () => {
    expect(buildCostItems(catalogs.de, base, 3)).toEqual([
      { guid: 2_500_001, icon: 'icon_27_1.png', name: 'Werkzeug', value: '9' },
    ]);
  });
});

describe('buildingView', () => {
  it('describes production details like the old database view', () => {
    const view = buildingView(catalogs.de, required(catalogs.de.productionBuildings.get(10_156)));
    expect(view.production).toMatchObject({ tpm: '1', inTons: true, product: { name: 'Gourmetmenüs' } });
    expect(required(view.production).raws.map(raw => raw.tpm)).toEqual(['1', '1.5']);
  });

  it('omits the unit for energy and production details for other buildings', () => {
    const plant = required(catalogs.de.productionBuildings.get(10_050));
    expect(required(buildingView(catalogs.de, plant).production).inTons).toBe(false);
    const depot = required(catalogs.de.buildings.get(10_001));
    expect(buildingView(catalogs.de, depot).production).toBeUndefined();
  });
});
