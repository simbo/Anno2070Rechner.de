import { describe, expect, it } from 'vitest';

import { backgrounds, dailyBackground } from './background';

/**
 * The local date of a number of days after a start date.
 *
 * @param offset - The number of days.
 * @returns The date.
 */
const dayAfterStart = (offset: number): Date => new Date(2026, 0, 1 + offset);

describe('dailyBackground', () => {
  const days = Array.from({ length: 5000 }, (_, offset) => dailyBackground(dayAfterStart(offset)));

  it('never shows the image of the day before', () => {
    for (let index = 1; index < days.length; index++) expect(days[index]).not.toBe(days[index - 1]);
  });

  it('uses every image evenly', () => {
    const counts = backgrounds.map(background => days.filter(day => day === background).length);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it('does not simply repeat a fixed order', () => {
    const cycles = new Set<string>();
    for (let index = 0; index < days.length; index += backgrounds.length) {
      cycles.add(days.slice(index, index + backgrounds.length).join(','));
    }
    expect(cycles.size).toBeGreaterThan(100);
  });

  it('depends only on the local date, not on the time of day', () => {
    expect(dailyBackground(new Date(2026, 10, 8, 0, 0, 1))).toBe(dailyBackground(new Date(2026, 10, 8, 23, 59, 59)));
  });

  it('works across daylight saving changes and year ends', () => {
    const switches = [new Date(2026, 2, 28), new Date(2026, 2, 29), new Date(2026, 11, 31), new Date(2027, 0, 1)];
    const [before, after, yearEnd, nextYear] = switches.map(date => dailyBackground(date));
    expect(after).not.toBe(before);
    expect(nextYear).not.toBe(yearEnd);
  });
});
