/**
 * Returns a value that a test requires, or fails the test with a clear message.
 *
 * @param value - The value that must exist.
 * @param what - What is missing, for the error message.
 * @returns The value.
 */
export function required<T>(value: T | null | undefined, what = 'value'): T {
  if (value === null || value === undefined) throw new Error(`Missing ${what}`);
  return value;
}
