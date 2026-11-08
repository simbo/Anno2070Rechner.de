import { describe, expect, it } from 'vitest';

import { efficiencyClass, filterNum } from './legacy';

describe('filterNum', () => {
  it('keeps only digits and minus signs before parsing, like the old site', () => {
    expect(filterNum('×12')).toBe(12);
    expect(filterNum('-46.6')).toBe(-466);
    expect(filterNum(' +5 ')).toBe(5);
    expect(filterNum('1.234')).toBe(1234);
  });

  it('returns 0 for missing or non-numeric text', () => {
    expect(filterNum(undefined)).toBe(0);
    expect(filterNum(null)).toBe(0);
    expect(filterNum('')).toBe(0);
    expect(filterNum('abc')).toBe(0);
  });
});

describe('efficiencyClass', () => {
  it('maps percentages to the old classes', () => {
    expect(efficiencyClass(100)).toBe('green');
    expect(efficiencyClass(81)).toBe('green');
    expect(efficiencyClass(80)).toBe('lightgreen');
    expect(efficiencyClass('41')).toBe('yellow');
    expect(efficiencyClass(40)).toBe('orange');
    expect(efficiencyClass(20)).toBe('red');
    expect(efficiencyClass(1)).toBe('red');
  });

  it('uses the nearest class outside 1 to 100, unlike the old site', () => {
    expect(efficiencyClass(0)).toBe('red');
    expect(efficiencyClass(-5)).toBe('red');
    expect(efficiencyClass(150)).toBe('green');
    expect(efficiencyClass('none')).toBe('red');
  });
});
