/**
 * Helpers ported unchanged from the old site's JavaScript, so that values derived from
 * displayed text behave exactly as before.
 */

/**
 * Reads a leading integer like JavaScript's `parseInt(text, 10)`: optional whitespace and
 * sign, then digits; anything after them is ignored.
 *
 * @param text - The text to read.
 * @returns The integer, or NaN without leading digits.
 */
export function parseLeadingInt(text: string): number {
  const match = /^\s*[+-]?\d+/.exec(text);
  return match ? Number(match[0]) : NaN;
}

/**
 * Reads a whole number from text like the old `filterNum()`: every character except
 * digits and minus signs is removed first, so `"-46.6"` becomes `-466`.
 *
 * @param text - The text to read.
 * @returns The number, or 0.
 */
export function filterNum(text: string | undefined | null): number {
  if (text === undefined || text === null) return 0;
  const value = parseLeadingInt(text.replaceAll(/[^0-9-]/g, ''));
  return Number.isNaN(value) ? 0 : value;
}

const efficiencyClasses = ['green', 'lightgreen', 'yellow', 'orange', 'red'];

/**
 * Width of each efficiency class in percent.
 */
const EFFICIENCY_STEP = 20;

/**
 * CSS class for an efficiency percentage like the old `getEfficiencyClass()`. Unlike
 * there, values outside 1 to 100 get the class of the nearest step instead of `undefined`,
 * and anything that is not a number counts as no efficiency.
 *
 * @param percent - The efficiency in percent, as number or text.
 * @returns The class name.
 */
export function efficiencyClass(percent: number | string): string {
  const value = parseLeadingInt(String(percent)) - 1;
  if (Number.isNaN(value)) return 'red';
  const index = efficiencyClasses.length - 1 - Math.floor(value / EFFICIENCY_STEP);
  return efficiencyClasses[Math.max(0, Math.min(efficiencyClasses.length - 1, index))];
}
