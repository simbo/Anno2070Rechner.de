import { describe, expect, it } from 'vitest';

import { catalogs } from '../tests/catalogs';

import {
  formatAlternatives,
  formatProductivities,
  parseAlternatives,
  parseChainUrl,
  parseProductivities,
} from './chain-url';

const catalog = catalogs.de;

describe('productivities in the URL', () => {
  it('read known buildings with valid values', () => {
    expect(parseProductivities(catalog, '10037:150,10045:50')).toEqual({ '10037': '150', '10045': '50' });
  });

  it('leave out everything else', () => {
    expect(parseProductivities(catalog, undefined)).toEqual({});
    expect(parseProductivities(catalog, '1:150,10037:0,10037:1000,10045:x,10048')).toEqual({});
  });

  it('are written sorted and without the default', () => {
    expect(formatProductivities({ '10045': '50', '10037': '150', '10048': '100' })).toBe('10037:150,10045:50');
    expect(formatProductivities({ '10037': '100' })).toBeUndefined();
  });

  it('survive a round trip', () => {
    const text = '10037:150,10045:50';
    expect(formatProductivities(parseProductivities(catalog, text))).toBe(text);
  });
});

describe('alternatives in the URL', () => {
  it('read known buildings only', () => {
    expect(parseAlternatives(catalog, '10098,1,x')).toEqual([10_098]);
    expect(parseAlternatives(catalog, undefined)).toEqual([]);
  });

  it('are written without the default producer of a product', () => {
    expect(formatAlternatives(catalog, [10_024, 10_098])).toBe('10098');
    expect(formatAlternatives(catalog, [10_024])).toBeUndefined();
  });
});

describe('parseChainUrl', () => {
  it('combines both parameters', () => {
    expect(parseChainUrl(catalog, '10037:150', '10098')).toEqual({
      productivity: { '10037': '150' },
      preferred: [10_098],
    });
  });
});
