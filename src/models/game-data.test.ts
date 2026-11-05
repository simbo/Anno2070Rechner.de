import { describe, expect, it } from 'vitest';

import { catalogs } from '../tests/catalogs';
import { required } from '../tests/required';

import { loadCatalog, rawTonsPerMinute, tonsPerMinute, type ProductionBuildingData } from './game-data';

const building = (guid: number): ProductionBuildingData => required(catalogs.de.productionBuildings.get(guid));

describe('catalog', () => {
  it('combines game data with localized names', () => {
    expect(required(catalogs.de.productionBuildings.get(10_045)).name).toBe('Fischerei');
    expect(required(catalogs.en.productionBuildings.get(10_045)).name).toBe('Fishery');
    expect(required(catalogs.de.products.get(2_500_036)).name).toBe('Erdöl');
    expect(required(catalogs.de.buildings.get(10_001)).name).toBe('Warendepot');
  });

  it('keeps all buildings and products of the old database', () => {
    expect(catalogs.de.productionBuildings.size).toBe(88);
    expect(catalogs.de.buildings.size).toBe(61);
    expect(catalogs.de.products.size).toBe(67);
    expect(catalogs.de.demands).toHaveLength(17);
  });

  it('lists producers of a product in guid order, which decides the default', () => {
    expect(required(catalogs.de.productionBuildingsByProduct.get(2_500_005)).map(b => b.guid)).toEqual([
      10_024, 10_098,
    ]);
  });

  it('loads the data of a language', async () => {
    const catalog = await loadCatalog('en');
    expect(catalog.language).toBe('en');
    expect(required(catalog.products.get(2_500_004)).name).toBe('Fish');
    expect(required((await loadCatalog('de')).products.get(2_500_004)).name).toBe('Fisch');
  });
});

describe('tons per minute', () => {
  it('derives output from production cycles', () => {
    expect(tonsPerMinute(building(10_045))).toBe(2);
    expect(tonsPerMinute(building(10_156))).toBe(1);
  });

  it('uses energy and eco values for energy and eco buildings', () => {
    expect(tonsPerMinute(building(10_050))).toBeGreaterThan(0);
    expect(building(10_050).type).toBe('energy');
    expect(tonsPerMinute(building(10_061))).toBe(100);
  });

  it('derives raw material needs', () => {
    const menu = building(10_156);
    expect(rawTonsPerMinute(menu, required(menu.raw1))).toBe(1);
    expect(rawTonsPerMinute(menu, required(menu.raw2))).toBe(1.5);
  });
});
