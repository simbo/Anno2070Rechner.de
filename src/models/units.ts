/**
 * Units of the game data and the calculator.
 */

/**
 * Kilograms per ton. The game stores amounts in kilograms; the site shows tons.
 */
export const KILOGRAMS_PER_TON = 1000;

/**
 * Milliseconds per minute. Production times are stored in milliseconds.
 */
export const MILLISECONDS_PER_MINUTE = 60_000;

/**
 * Game units per displayed point of energy or eco balance.
 */
export const POINT_SCALE = 4096;

/**
 * Percent of a whole.
 */
export const PERCENT = 100;

/**
 * Decimal places kept of an exact number of buildings before rounding it up.
 */
const BUILDING_COUNT_SCALE = 1e9;

/**
 * Number of buildings needed for an exact, possibly fractional amount of them. Rounding
 * errors of the calculation are dropped first: 23.28 t/min from buildings producing 3.88
 * t/min come out as 6.000000000000001, which still means 6 buildings.
 *
 * @param exact - The exact amount.
 * @returns The number of buildings.
 */
export const buildingCount = (exact: number): number =>
  Math.ceil(Math.round(exact * BUILDING_COUNT_SCALE) / BUILDING_COUNT_SCALE);

/**
 * Residents that the game's demand amounts refer to.
 */
export const RESIDENTS_PER_DEMAND = 100;
