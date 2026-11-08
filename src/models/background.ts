/**
 * The background images of the site.
 */
export const backgrounds = ['eco1', 'eco2', 'eco3', 'eco4', 'eco5', 'tycoon1', 'tycoon2'] as const;

/**
 * A background image.
 */
export type Background = (typeof backgrounds)[number];

/**
 * What a visitor can choose: a fixed image, or one that changes daily.
 */
export type BackgroundChoice = Background | 'random';

/**
 * Milliseconds per day.
 */
const MILLISECONDS_PER_DAY = 86_400_000;

/**
 * Spreads consecutive seeds, which would otherwise start out alike.
 */
const SEED_MULTIPLIER = 48_271;

/**
 * Multiplier and modulus of the Park-Miller random number generator.
 */
const RANDOM_MULTIPLIER = 16_807;
const RANDOM_MODULUS = 2_147_483_647;

/**
 * Exchanges two entries of a list.
 *
 * @param list - The list.
 * @param first - The position of one entry.
 * @param second - The position of the other entry.
 */
function swap(list: Background[], first: number, second: number): void {
  const entry = list[first];
  list[first] = list[second];
  list[second] = entry;
}

/**
 * Shuffles the images in a way that only depends on the seed.
 *
 * @param seed - A number that selects the order.
 * @returns The images in a shuffled order.
 */
function shuffled(seed: number): Background[] {
  const order = [...backgrounds];
  let state = ((seed * SEED_MULTIPLIER) % (RANDOM_MODULUS - 1)) + 1;
  for (let index = order.length - 1; index > 0; index--) {
    state = (state * RANDOM_MULTIPLIER) % RANDOM_MODULUS;
    swap(order, index, state % (index + 1));
  }
  return order;
}

/**
 * The image of a day. Every image appears once per cycle, in an order that changes from
 * cycle to cycle and never repeats the image of the day before.
 *
 * @param date - The day, read in the visitor's local time.
 * @returns The image.
 */
export function dailyBackground(date: Date): Background {
  const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MILLISECONDS_PER_DAY;
  const cycle = Math.floor(day / backgrounds.length);
  const order = shuffled(cycle);
  if (order[0] === shuffled(cycle - 1).slice(-1)[0]) swap(order, 0, 1);
  return order[day - cycle * backgrounds.length];
}

/**
 * The class of the body element that shows an image.
 *
 * @param background - The image.
 * @returns The class name.
 */
export const backgroundClass = (background: Background): string => `bg-${background}`;

/**
 * The address of an image.
 *
 * @param background - The image.
 * @returns The address.
 */
export const backgroundUrl = (background: Background): string => `/img/bg-body-${background}.jpg`;
