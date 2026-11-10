import { z } from 'zod/mini';

import { fromEntries } from '../lib/compat';
import { filterNum } from '../lib/legacy';
import type { Language } from '../routes';

import type { ChainSettings } from './chain-state';
import { groups, levelCount, type Group } from './population';
import { PERCENT } from './units';

/**
 * Inputs of the population calculator that make up a game. Values are kept as the text of
 * their input fields, because the old calculator derived everything from that text.
 */
export interface GameInputs {
  /**
   * Houses per faction: index 0 is the total, then one entry per level.
   */
  residences: Record<Group, string[]>;

  /**
   * Highest allowed level per faction, as stored in the hidden field.
   */
  maxUpgrade: Record<Group, string>;

  /**
   * Position of the upgrade slider.
   */
  upgradeSlider: Record<Group, number>;

  /**
   * Active information channel per faction: "0", "1" or "2".
   */
  info: Record<Group, string>;

  /**
   * Residents per faction: index 0 is the total, then one entry per level.
   */
  inhabitants: Record<Group, string[]>;

  /**
   * Productivity input per production building guid.
   */
  productivity: Record<string, string>;

  /**
   * Target of the commodity chain: "0" population demand, "1" maximum production.
   */
  ccTarget: string;

  /**
   * What the visitor set in a commodity chain, per production building guid.
   */
  chains: Record<string, ChainSettings>;
}

/**
 * A saved game of the population calculator.
 */
export interface Game {
  /**
   * Unique id, kept in exports to recognize other versions of the same game.
   */
  id: string;

  /**
   * The name the visitor gave it; without one, the name follows the start date.
   */
  name?: string;

  /**
   * Local start date as `YYYY-MM-DD`.
   */
  startedAt: string;

  /**
   * Counts the games started on the same day.
   */
  number: number;

  /**
   * Time of the last change in milliseconds.
   */
  updatedAt: number;

  /**
   * Time it was last opened in milliseconds.
   */
  usedAt: number;
  inputs: GameInputs;
}

/**
 * All games and the current one.
 */
export interface GamesState {
  currentId: string;
  games: Game[];
}

/**
 * One value per faction.
 *
 * @param value - The value for a faction.
 * @returns The values by faction.
 */
const perGroup = <T>(value: (group: Group) => T): Record<Group, T> =>
  fromEntries(groups.map((group): [Group, T] => [group, value(group)]));

/**
 * Input texts for the total and every level of a faction, all "0".
 *
 * @param group - The faction.
 * @returns The texts.
 */
const zeros = (group: Group): string[] => Array.from({ length: levelCount(group) + 1 }, () => '0');

/**
 * The defaults of the old calculator.
 *
 * @returns Fresh default inputs.
 */
export const defaultInputs = (): GameInputs => ({
  residences: perGroup(zeros),
  maxUpgrade: perGroup(group => String(levelCount(group))),
  upgradeSlider: perGroup(levelCount),
  info: perGroup(() => '0'),
  inhabitants: perGroup(zeros),
  productivity: {},
  ccTarget: '0',
  chains: {},
});

const groupRecord = <T extends z.ZodMiniType>(schema: T): z.ZodMiniObject<Record<Group, T>> =>
  z.object({ ecos: schema, tycoons: schema, techs: schema });

const texts = (length: number): z.ZodMiniArray<z.ZodMiniString> => z.array(z.string()).check(z.length(length));

const levelTexts = z.object(perGroup(group => texts(levelCount(group) + 1)));

const chainSettingsSchema = z.object({
  productivity: z.record(z.string(), z.string()),
  preferred: z.array(z.number()),
});

const inputsSchema = z.object({
  residences: levelTexts,
  maxUpgrade: groupRecord(z.string()),
  upgradeSlider: groupRecord(z.number()),
  info: groupRecord(z.enum(['0', '1', '2'])),
  inhabitants: levelTexts,
  productivity: z.record(z.string(), z.string()),
  ccTarget: z.enum(['0', '1']),
  chains: z.record(z.string(), chainSettingsSchema),
});

const MAX_NAME_LENGTH = 60;

const nameText = z.string().check(z.maxLength(MAX_NAME_LENGTH));
const dayText = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/));

const gameFields = {
  id: z.string().check(z.minLength(1)),
  name: z.optional(nameText),
  startedAt: dayText,
  number: z.number().check(z.gte(1)),
  updatedAt: z.number(),
  inputs: inputsSchema,
};

const gameSchema = z.object({ ...gameFields, usedAt: z.number() });
const exportSchema = z.object(gameFields);

const byText = (a: string, b: string): number => a.localeCompare(b);

/**
 * A text that stands for the content of inputs. Productivities of 100 % equal none, because
 * the calculator fills them in for every building.
 *
 * @param inputs - The inputs.
 * @returns The same text for the same content.
 */
export function inputsFingerprint(inputs: GameInputs): string {
  const productivity = Object.keys(inputs.productivity)
    .filter(guid => filterNum(inputs.productivity[guid]) !== PERCENT)
    .sort(byText)
    .map(guid => [guid, inputs.productivity[guid]]);
  const chains = Object.keys(inputs.chains)
    .sort(byText)
    .map(guid => [guid, inputs.chains[guid]]);
  return JSON.stringify({ ...inputs, productivity, chains });
}

/**
 * Whether inputs equal the defaults.
 *
 * @param inputs - The inputs.
 * @returns True without any entered value.
 */
export const isDefaultInputs = (inputs: GameInputs): boolean =>
  inputsFingerprint(inputs) === inputsFingerprint(defaultInputs());

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * A local date as `YYYY-MM-DD`.
 *
 * @param date - The date.
 * @returns The text.
 */
export const dayOf = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const DAY_PARTS = 3;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * A `YYYY-MM-DD` date as the language writes it.
 *
 * @param day - The date.
 * @param language - The language.
 * @returns The text, for example "08.11.2026" or "Nov 8, 2026".
 */
export function formatDay(day: string, language: Language): string {
  const [year, month, date] = day.split('-', DAY_PARTS);
  return language === 'de' ? `${date}.${month}.${year}` : `${MONTHS[Number(month) - 1]} ${Number(date)}, ${year}`;
}

/**
 * The name of a game as it is shown.
 *
 * @param game - The game.
 * @param language - The language of the page.
 * @returns The given name, or one from its start date.
 */
export function gameName(game: Pick<Game, 'name' | 'startedAt' | 'number'>, language: Language): string {
  if (game.name !== undefined) return game.name;
  const suffix = game.number > 1 ? ` (${game.number})` : '';
  const day = formatDay(game.startedAt, language);
  return `${language === 'de' ? 'Spiel vom' : 'Game from'} ${day}${suffix}`;
}

const ID_BYTES = 16;
const HEX = 16;
const BYTE_OFFSET = 256;

/**
 * A new unique id: 16 random bytes from the browser's cryptographic random source as hex.
 *
 * @returns The id with 32 hex digits.
 */
const uniqueId = (): string =>
  Array.from(globalThis.crypto.getRandomValues(new Uint8Array(ID_BYTES)), byte =>
    (byte + BYTE_OFFSET).toString(HEX).slice(1),
  ).join('');

const nextNumber = (games: readonly Game[], day: string): number =>
  Math.max(0, ...games.filter(game => game.startedAt === day).map(game => game.number)) + 1;

/**
 * Creates an empty game.
 *
 * @param games - The existing games.
 * @param now - The current time.
 * @returns The game.
 */
export function createGame(games: readonly Game[], now: Date): Game {
  const day = dayOf(now);
  return {
    id: uniqueId(),
    startedAt: day,
    number: nextNumber(games, day),
    updatedAt: now.getTime(),
    usedAt: now.getTime(),
    inputs: defaultInputs(),
  };
}

/**
 * The most recently used games first.
 *
 * @param games - The games.
 * @returns A sorted copy.
 */
export const gamesByUse = (games: readonly Game[]): Game[] => [...games].sort((a, b) => b.usedAt - a.usedAt);

/**
 * Reads the outer structure of stored games. Damaged data counts as none.
 *
 * @param raw - The stored text.
 * @returns What it contains.
 */
function parseStored(raw: string | null | undefined): { currentId?: unknown; games?: unknown } {
  try {
    return (JSON.parse(raw ?? '{}') ?? {}) as { currentId?: unknown; games?: unknown };
  } catch {
    return {};
  }
}

/**
 * Reads stored games. Invalid games are left out; without any game, a new one starts.
 *
 * @param raw - The stored text.
 * @param now - The current time.
 * @returns The state.
 */
export function parseGames(raw: string | null | undefined, now: Date): GamesState {
  const { currentId, games: list } = parseStored(raw);
  const games = (Array.isArray(list) ? list : []).reduce<Game[]>((valid, entry) => {
    const result = gameSchema.safeParse(entry);
    return result.success ? [...valid, result.data] : valid;
  }, []);
  if (games.length === 0) {
    const game = createGame([], now);
    return { currentId: game.id, games: [game] };
  }
  const known = games.some(game => game.id === currentId);
  return { currentId: known ? (currentId as string) : gamesByUse(games)[0].id, games };
}

/**
 * Removes a game. After removing the current one, the most recently used game takes over, or
 * a new one if none is left.
 *
 * @param state - The state, which is changed.
 * @param id - The game.
 * @param now - The current time.
 */
export function removeGame(state: GamesState, id: string, now: Date): void {
  state.games = state.games.filter(game => game.id !== id);
  if (state.games.length === 0) state.games = [createGame([], now)];
  if (state.currentId !== id) return;
  const [next] = gamesByUse(state.games);
  next.usedAt = now.getTime();
  state.currentId = next.id;
}

const EXPORT_PREFIX = 'anno2070';
const EXPORT_VERSION = 1;
const EXPORT_PARTS = 3;

/**
 * The text that carries a game to another browser.
 *
 * @param game - The game.
 * @returns The text.
 */
export function exportGame(game: Game): string {
  const { usedAt, ...exported } = game;
  const json = JSON.stringify(exported);
  const data = globalThis.btoa(encodeURIComponent(json));
  return `${EXPORT_PREFIX}:${EXPORT_VERSION}:${data}`;
}

/**
 * The outcome of reading an exported text.
 */
export type ParsedImport = { kind: 'invalid' } | { kind: 'newer' } | { kind: 'game'; game: Omit<Game, 'usedAt'> };

/**
 * Reads an exported text.
 *
 * @param text - The text.
 * @returns The game, or why there is none.
 */
export function parseImport(text: string): ParsedImport {
  const [prefix, version, data] = text.trim().split(':', EXPORT_PARTS);
  if (prefix !== EXPORT_PREFIX || !version || !data) return { kind: 'invalid' };
  if (Number(version) > EXPORT_VERSION) return { kind: 'newer' };
  try {
    const json = decodeURIComponent(globalThis.atob(data));
    const result = exportSchema.safeParse(JSON.parse(json));
    return result.success ? { kind: 'game', game: result.data } : { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

/**
 * What importing a game means for the existing ones.
 */
export type ImportPlan = { kind: 'add' } | { kind: 'same'; existing: Game } | { kind: 'conflict'; existing: Game };

/**
 * Compares an imported game with the existing ones by id and content.
 *
 * @param state - The state.
 * @param game - The imported game.
 * @returns What has to happen.
 */
export function planImport(state: GamesState, game: Omit<Game, 'usedAt'>): ImportPlan {
  const existing = state.games.find(entry => entry.id === game.id);
  if (!existing) return { kind: 'add' };
  return {
    kind: inputsFingerprint(existing.inputs) === inputsFingerprint(game.inputs) ? 'same' : 'conflict',
    existing,
  };
}

/**
 * A name that no other game has, adding a counter if needed.
 *
 * @param games - The existing games.
 * @param name - The wanted name.
 * @returns The free name.
 */
function freeName(games: readonly Game[], name: string): string {
  const taken = new Set(games.map(game => game.name));
  let candidate = name;
  for (let counter = 2; taken.has(candidate); counter++) candidate = `${name} (${counter})`;
  return candidate;
}

/**
 * Adds an imported game as a new one and opens it. Names and day counters stay unique.
 *
 * @param state - The state, which is changed.
 * @param game - The imported game.
 * @param now - The current time.
 * @param asCopy - Whether it gets a new id because its id is taken.
 */
export function addImported(state: GamesState, game: Omit<Game, 'usedAt'>, now: Date, asCopy = false): void {
  const added: Game = {
    ...game,
    id: asCopy ? uniqueId() : game.id,
    ...(game.name !== undefined && { name: freeName(state.games, game.name) }),
    number: game.name === undefined ? nextNumber(state.games, game.startedAt) : game.number,
    usedAt: now.getTime(),
  };
  state.games.push(added);
  state.currentId = added.id;
}

/**
 * Replaces an existing game with an imported version and opens it.
 *
 * @param state - The state, which is changed.
 * @param game - The imported game with the id of an existing one.
 * @param now - The current time.
 */
export function overwriteWithImport(state: GamesState, game: Omit<Game, 'usedAt'>, now: Date): void {
  state.games = state.games.map(entry => (entry.id === game.id ? { ...game, usedAt: now.getTime() } : entry));
  state.currentId = game.id;
}

/**
 * The highest length of a game's name.
 */
export const maxNameLength = MAX_NAME_LENGTH;
