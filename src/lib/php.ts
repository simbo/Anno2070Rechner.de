/**
 * Number and string functions that behave like their PHP 8.2 counterparts used by the
 * old site. They keep calculations, rounding, number output and sorting identical to
 * the live PHP version.
 */

/**
 * Significant digits PHP rounds to before rounding to the requested places.
 */
const PRE_ROUNDING_DIGITS = 15;

/**
 * Lowest precision PHP uses for pre-rounding is `-4 * DBL_DIG`.
 */
const PRECISION_FACTOR = 4;
const MIN_PRECISION = -PRECISION_FACTOR * PRE_ROUNDING_DIGITS;

/**
 * Values from this magnitude on cannot be rounded meaningfully.
 */
const ROUNDING_LIMIT = 1e15;

/**
 * Tolerance below which a value counts as already rounded.
 */
const ROUNDING_FUZZ = 1e-15;

/**
 * Significant digits of PHP's float output (`precision=14`).
 */
const OUTPUT_DIGITS = 14;

/**
 * Smallest decimal exponent PHP prints without exponent notation.
 */
const MIN_PLAIN_EXPONENT = -4;

/**
 * Half of a unit, the rounding threshold.
 */
const HALF = 0.5;

/**
 * Base of decimal places.
 */
const DECIMAL = 10;

const roundHelper = (value: number): number => (value >= 0 ? Math.floor(value + HALF) : Math.ceil(value - HALF));

const pow10 = (exponent: number): number => DECIMAL ** exponent;

/**
 * Rounds like PHP's `round()` (mode half up, PHP 8.2): the value is first rounded to 15
 * significant digits, which avoids results such as 1.005 rounding down.
 *
 * @param value - The number to round.
 * @param places - Decimal places, may be negative.
 * @returns The rounded number.
 */
export function phpRound(value: number, places = 0): number {
  if (value === 0 || !Number.isFinite(value)) return value;
  const precisionPlaces = PRE_ROUNDING_DIGITS - 1 - Math.floor(Math.log10(Math.abs(value)));
  const factor = pow10(Math.abs(places));
  let temporary: number;
  if (precisionPlaces > places && precisionPlaces - PRE_ROUNDING_DIGITS < places) {
    const usePrecision = Math.max(precisionPlaces, MIN_PRECISION);
    temporary = roundHelper(usePrecision >= 0 ? value * pow10(usePrecision) : value / pow10(-usePrecision));
    temporary /= pow10(Math.abs(Math.max(MIN_PRECISION, places - usePrecision)));
  } else {
    temporary = places >= 0 ? value * factor : value / factor;
    if (Math.abs(temporary) >= ROUNDING_LIMIT) return value;
  }
  if (Math.abs(temporary - roundHelper(temporary)) >= ROUNDING_FUZZ) temporary = roundHelper(temporary);
  return places > 0 ? temporary / factor : temporary * factor;
}

/**
 * Converts a number to a string like PHP's float output with `precision=14`:
 * up to 14 significant digits, no trailing zeros, `-0` for negative zero, and
 * exponent notation for very small or large numbers.
 *
 * @param value - The number to convert.
 * @returns The string PHP would print.
 */
export function phpNumber(value: number): string {
  if (Number.isNaN(value)) return 'NAN';
  if (!Number.isFinite(value)) return value > 0 ? 'INF' : '-INF';
  if (value === 0) return Object.is(value, -0) ? '-0' : '0';
  const [mantissa, exponentText] = value.toExponential(OUTPUT_DIGITS - 1).split('e') as [string, string];
  const digits = mantissa.replace('-', '').replace('.', '').replace(/0+$/, '') || '0';
  return (value < 0 ? '-' : '') + formatDigits(digits, Number(exponentText));
}

/**
 * Places the decimal point in significant digits like PHP's float output.
 *
 * @param digits - The significant digits without trailing zeros.
 * @param exponent - The decimal exponent of the first digit.
 * @returns The unsigned number text.
 */
function formatDigits(digits: string, exponent: number): string {
  if (exponent < MIN_PLAIN_EXPONENT || exponent >= OUTPUT_DIGITS) {
    return `${digits[0]}.${digits.slice(1) || '0'}E${exponent < 0 ? '-' : '+'}${Math.abs(exponent)}`;
  }
  if (exponent < 0) return `0.${'0'.repeat(-exponent - 1)}${digits}`;
  const integer = digits.slice(0, exponent + 1).padEnd(exponent + 1, '0');
  const fraction = digits.slice(exponent + 1);
  return fraction ? `${integer}.${fraction}` : integer;
}

/**
 * Parses a request value like PHP's `intval()`: leading whitespace and sign, then
 * digits; anything else ends the number.
 *
 * @param value - The value to parse.
 * @returns The integer, or 0.
 */
export function phpIntval(value: string | number | undefined | null): number {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : 0;
  const match = /^\s*([+-]?\d+)/.exec(value ?? '');
  return match ? Number(match[1]) : 0;
}

/**
 * Parses a request value like PHP's `floatval()`: the longest numeric prefix.
 *
 * @param value - The value to parse.
 * @returns The number, or 0.
 */
export function phpFloatval(value: string | number | undefined | null): number {
  if (typeof value === 'number') return value;
  const match = /^\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)/.exec(value ?? '');
  return match ? Number(match[1]) : 0;
}

const encoder = new TextEncoder();

// Byte values of the ASCII characters the comparison looks at.
const ZERO = 0x30;
const NINE = 0x39;
const SPACE = 0x20;
const TAB = 0x09;
const CARRIAGE_RETURN = 0x0d;
const LOWER_A = 0x61;
const LOWER_Z = 0x7a;
const CASE_OFFSET = 0x20;

const isDigit = (byte: number | undefined): boolean => byte !== undefined && byte >= ZERO && byte <= NINE;

// C's isspace(): space, tab, line feed, vertical tab, form feed and carriage return.
const isSpace = (byte: number | undefined): boolean =>
  byte !== undefined && (byte === SPACE || (byte >= TAB && byte <= CARRIAGE_RETURN));

const asciiUpper = (byte: number | undefined): number | undefined =>
  byte !== undefined && byte >= LOWER_A && byte <= LOWER_Z ? byte - CASE_OFFSET : byte;

/**
 * Read positions in both byte arrays, advanced by the comparison helpers.
 */
interface Cursor {
  a: Uint8Array;
  b: Uint8Array;
  ai: number;
  bi: number;
}

/**
 * Compares runs of digits left-aligned, like decimals (`compare_left` in PHP).
 *
 * @param cursor - The read positions; advanced past both runs.
 * @returns The result, 0 if the runs are equal.
 */
function compareLeft(cursor: Cursor): number {
  for (;;) {
    const da = isDigit(cursor.a[cursor.ai]);
    const db = isDigit(cursor.b[cursor.bi]);
    if (!da && !db) return 0;
    if (!da) return -1;
    if (!db) return 1;
    const ca = cursor.a[cursor.ai];
    const cb = cursor.b[cursor.bi];
    if (ca !== cb) return ca < cb ? -1 : 1;
    cursor.ai++;
    cursor.bi++;
  }
}

/**
 * Compares runs of digits right-aligned: the longer run is the bigger number, otherwise
 * the first differing digit decides (`compare_right` in PHP).
 *
 * @param cursor - The read positions; advanced past both runs.
 * @returns The result, 0 if the runs are equal.
 */
function compareRight(cursor: Cursor): number {
  let bias = 0;
  for (;;) {
    const da = isDigit(cursor.a[cursor.ai]);
    const db = isDigit(cursor.b[cursor.bi]);
    if (!da && !db) return bias;
    if (!da) return -1;
    if (!db) return 1;
    const ca = cursor.a[cursor.ai];
    const cb = cursor.b[cursor.bi];
    if (bias === 0 && ca !== cb) bias = ca < cb ? -1 : 1;
    cursor.ai++;
    cursor.bi++;
  }
}

/**
 * Result when at least one string is exhausted, or undefined to continue.
 *
 * @param cursor - The read positions.
 * @returns -1, 0, 1 or undefined.
 */
function endResult(cursor: Cursor): number | undefined {
  const aDone = cursor.ai >= cursor.a.length;
  const bDone = cursor.bi >= cursor.b.length;
  return aDone || bDone ? Number(bDone) - Number(aDone) : undefined;
}

/**
 * Skips leading zeros of both strings, which PHP does once at the start.
 *
 * @param cursor - The read positions.
 */
function skipLeadingZeros(cursor: Cursor): void {
  while (cursor.a[cursor.ai] === ZERO && isDigit(cursor.a[cursor.ai + 1])) cursor.ai++;
  while (cursor.b[cursor.bi] === ZERO && isDigit(cursor.b[cursor.bi + 1])) cursor.bi++;
}

/**
 * Skips whitespace in both strings, like PHP before each comparison step.
 *
 * @param cursor - The read positions.
 */
function skipSpaces(cursor: Cursor): void {
  while (isSpace(cursor.a[cursor.ai])) cursor.ai++;
  while (isSpace(cursor.b[cursor.bi])) cursor.bi++;
}

/**
 * Compares the runs of digits at both read positions, if there are any.
 *
 * @param cursor - The read positions.
 * @returns The result, or undefined to continue with the next characters.
 */
function compareNumbers(cursor: Cursor): number | undefined {
  if (!isDigit(cursor.a[cursor.ai]) || !isDigit(cursor.b[cursor.bi])) return undefined;
  const fractional = cursor.a[cursor.ai] === ZERO || cursor.b[cursor.bi] === ZERO;
  const result = fractional ? compareLeft(cursor) : compareRight(cursor);
  return result === 0 ? endResult(cursor) : result;
}

/**
 * Compares two strings like PHP's `strnatcasecmp()`: natural order for numbers,
 * ASCII-only case folding, and byte order for everything else (so umlauts sort after
 * all ASCII letters, as on the old site).
 *
 * @param left - The first string.
 * @param right - The second string.
 * @returns A negative number, zero or a positive number.
 */
export function phpStrnatcasecmp(left: string, right: string): number {
  const cursor: Cursor = { a: encoder.encode(left), b: encoder.encode(right), ai: 0, bi: 0 };
  if (cursor.a.length === 0 || cursor.b.length === 0) return Math.sign(cursor.a.length - cursor.b.length);
  skipLeadingZeros(cursor);
  for (;;) {
    skipSpaces(cursor);
    const numbers = compareNumbers(cursor);
    if (numbers !== undefined) return numbers;
    const ua = asciiUpper(cursor.a[cursor.ai]) ?? 0;
    const ub = asciiUpper(cursor.b[cursor.bi]) ?? 0;
    if (ua !== ub) return ua < ub ? -1 : 1;
    cursor.ai++;
    cursor.bi++;
    const end = endResult(cursor);
    if (end !== undefined) return end;
  }
}
