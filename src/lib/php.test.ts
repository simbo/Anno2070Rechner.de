import { describe, expect, it } from 'vitest';

import { phpFloatval, phpIntval, phpNumber, phpRound, phpStrnatcasecmp } from './php';

describe('phpRound', () => {
  it('rounds half away from zero', () => {
    expect(phpRound(2.5)).toBe(3);
    expect(phpRound(-2.5)).toBe(-3);
    expect(phpRound(0.49)).toBe(0);
    expect(phpRound(11.75, 1)).toBe(11.8);
    expect(phpRound(5.875, 2)).toBe(5.88);
  });

  it('pre-rounds to 15 significant digits like PHP 8.2', () => {
    expect(phpRound(1.005, 2)).toBe(1.01);
    expect(phpRound(1.955, 2)).toBe(1.96);
    expect(phpRound(0.285, 2)).toBe(0.29);
  });

  it('keeps negative zero for small negative values', () => {
    expect(Object.is(phpRound(-0.2), -0)).toBe(true);
  });

  it('passes through zero and non-finite values', () => {
    expect(phpRound(0)).toBe(0);
    expect(phpRound(NaN)).toBeNaN();
    expect(phpRound(Infinity)).toBe(Infinity);
  });

  it('supports negative places', () => {
    expect(phpRound(1250, -2)).toBe(1300);
  });
});

describe('phpNumber', () => {
  it('prints integers and decimals without trailing zeros', () => {
    expect(phpNumber(6)).toBe('6');
    expect(phpNumber(-24)).toBe('-24');
    expect(phpNumber(11.8)).toBe('11.8');
    expect(phpNumber(1.5)).toBe('1.5');
  });

  it('uses 14 significant digits', () => {
    expect(phpNumber(4 / 3)).toBe('1.3333333333333');
    expect(phpNumber(2 / 3)).toBe('0.66666666666667');
    expect(phpNumber(0.1 + 0.2)).toBe('0.3');
  });

  it('prints negative zero and special values like PHP', () => {
    expect(phpNumber(-0)).toBe('-0');
    expect(phpNumber(0)).toBe('0');
    expect(phpNumber(NaN)).toBe('NAN');
    expect(phpNumber(-Infinity)).toBe('-INF');
  });

  it('switches to exponent notation for very small and large numbers', () => {
    expect(phpNumber(0.0000125)).toBe('1.25E-5');
    expect(phpNumber(0.00001)).toBe('1.0E-5');
    expect(phpNumber(1e15)).toBe('1.0E+15');
    expect(phpNumber(0.0001)).toBe('0.0001');
  });
});

describe('phpIntval and phpFloatval', () => {
  it('parse numeric prefixes', () => {
    expect(phpIntval('12abc')).toBe(12);
    expect(phpIntval(' -3')).toBe(-3);
    expect(phpIntval('abc')).toBe(0);
    expect(phpIntval(undefined)).toBe(0);
    expect(phpIntval(4.9)).toBe(4);
    expect(phpFloatval('2.5')).toBe(2.5);
    expect(phpFloatval('7')).toBe(7);
    expect(phpFloatval('.5x')).toBe(0.5);
    expect(phpFloatval('1e3')).toBe(1000);
    expect(phpFloatval('x')).toBe(0);
    expect(phpFloatval(3)).toBe(3);
  });
});

describe('phpStrnatcasecmp', () => {
  const sort = (values: string[]): string[] => values.toSorted(phpStrnatcasecmp);

  it('ignores ASCII case', () => {
    expect(sort(['Chemiefabrik', 'CO2-Speicher', 'Casino'])).toEqual(['Casino', 'Chemiefabrik', 'CO2-Speicher']);
    expect(phpStrnatcasecmp('abc', 'ABC')).toBe(0);
  });

  it('orders numbers naturally', () => {
    expect(sort(['item10', 'item2', 'item1'])).toEqual(['item1', 'item2', 'item10']);
    // Runs starting with zero compare left-aligned, then the rest compares as a new run.
    expect(sort(['x 0.25', 'x 0.5'])).toEqual(['x 0.5', 'x 0.25']);
    expect(phpStrnatcasecmp('a1', 'a01')).not.toBe(0);
    expect(phpStrnatcasecmp('007', '7')).toBe(0);
  });

  it('sorts umlauts after all ASCII letters by their bytes', () => {
    expect(sort(['Ölplattform', 'Zuckerrohr', 'Orangen'])).toEqual(['Orangen', 'Zuckerrohr', 'Ölplattform']);
  });

  it('handles empty strings and prefixes', () => {
    expect(phpStrnatcasecmp('', '')).toBe(0);
    expect(phpStrnatcasecmp('', 'a')).toBe(-1);
    expect(phpStrnatcasecmp('a', '')).toBe(1);
    expect(phpStrnatcasecmp('Bau', 'Bauzellen')).toBe(-1);
    expect(phpStrnatcasecmp('Bauzellen', 'Bau')).toBe(1);
  });

  it('skips whitespace', () => {
    expect(phpStrnatcasecmp('a  b', 'a b')).toBe(0);
  });
});
