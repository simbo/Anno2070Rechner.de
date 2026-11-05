import { describe, expect, it } from 'vitest';

import { catalogs } from '../tests/catalogs';
import { required } from '../tests/required';

import { databaseResults, nameSuggestions, productionSuggestions, searchText } from './database';

const names = (items: { name: string }[]): string[] => items.map(item => item.name);

describe('searchText', () => {
  it('lowercases ASCII letters and Ö, Ä, Ü only, like the old site', () => {
    expect(searchText('ÖlWERK')).toBe('ölwerk');
    expect(searchText('ÄÜ')).toBe('äü');
    expect(searchText('É')).toBe('É');
  });
});

describe('databaseResults', () => {
  it('finds production buildings, buildings and products by name part', () => {
    const results = databaseResults(catalogs.de, { search: 'Öl' });
    expect(names(results.productionBuildings)).toEqual(['Erdölraffinerie', 'Ölbohrer', 'Ölplattform']);
    expect(names(results.products)).toEqual(['Erdöl', 'Rohöl']);
  });

  it('sorts umlauts after ASCII letters like the old natural sort', () => {
    const sorted = names(databaseResults(catalogs.de, { productionbuilding: 'all' }).productionBuildings);
    // UTF-8 bytes decide: Ö (C3 96) before Ü (C3 9C), both after Z.
    expect(sorted.slice(-4)).toEqual([sorted.at(-4), 'Ölbohrer', 'Ölplattform', 'Überwachungsstation']);
    expect(required(sorted.at(-4)).startsWith('Z')).toBe(true);
  });

  it('filters production buildings by type', () => {
    const farms = databaseResults(catalogs.de, { productionbuilding: 'farm' }).productionBuildings;
    expect(farms.length).toBeGreaterThan(0);
    expect(farms.every(building => building.type === 'farm')).toBe(true);
    expect(
      databaseResults(catalogs.de, { productionbuilding: 'energy' }).productionBuildings.every(
        b => b.type === 'energy',
      ),
    ).toBe(true);
  });

  it('shows single entries and replaces lists with "all"', () => {
    expect(names(databaseResults(catalogs.de, { product: '2500004' }).products)).toEqual(['Fisch']);
    expect(databaseResults(catalogs.de, { building: 'all' }).buildings).toHaveLength(catalogs.de.buildings.size);
    expect(databaseResults(catalogs.de, { search: 'Fisch', product: 'all' }).products).toHaveLength(
      catalogs.de.products.size,
    );
  });

  it('ignores empty searches, "0" and unknown ids like PHP', () => {
    const empty = { productionBuildings: [], buildings: [], products: [] };
    expect(databaseResults(catalogs.de, { search: '' })).toEqual(empty);
    expect(databaseResults(catalogs.de, { search: '0' })).toEqual(empty);
    expect(databaseResults(catalogs.de, { building: '' })).toEqual(empty);
    expect(databaseResults(catalogs.de, { product: '1' })).toEqual(empty);
  });

  it('searches in the page language', () => {
    expect(names(databaseResults(catalogs.en, { search: 'fish' }).products)).toEqual(['Fish']);
  });
});

describe('suggestions', () => {
  it('suggest production buildings for building and product names', () => {
    expect(productionSuggestions(catalogs.de, 'fisch').map(s => [s.name, s.guid])).toEqual([['Fischerei', 10_045]]);
    const oil = productionSuggestions(catalogs.de, 'rohöl').map(s => s.name);
    expect(oil).toEqual(['Ölbohrer', 'Ölplattform']);
  });

  it('suggest names of all game objects starting with the text', () => {
    expect(nameSuggestions(catalogs.de, 'a')).toEqual([
      'Abfertigungsterminal',
      'Akademie',
      'Algen',
      'Aquafarm',
      'Aromastoffproduktion',
      'Atomkraftwerk',
    ]);
    expect(nameSuggestions(catalogs.de, 'Öl')).toEqual(['Ölbohrer', 'Ölplattform']);
    expect(nameSuggestions(catalogs.de, '')).toEqual([]);
    expect(productionSuggestions(catalogs.de, '0')).toEqual([]);
  });
});
