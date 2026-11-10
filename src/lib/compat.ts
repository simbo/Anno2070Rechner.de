/**
 * Small replacements for array and object helpers that are newer than the oldest browsers
 * this site supports, see the browser support section of `docs/decisions.md`.
 */

/**
 * Joins nested lists into one list, like `flat()`.
 *
 * @param lists - The lists.
 * @returns All items in order.
 */
export const flatten = <T>(lists: readonly (readonly T[])[]): T[] =>
  lists.reduce<T[]>((result, list) => [...result, ...list], []);

/**
 * Builds an object from key and value pairs, like `Object.fromEntries()`.
 *
 * @param entries - The pairs.
 * @returns The object.
 */
export const fromEntries = <K extends string, V>(entries: readonly (readonly [K, V])[]): Record<K, V> => {
  const result = {} as Record<K, V>;
  for (const [key, value] of entries) result[key] = value;
  return result;
};
