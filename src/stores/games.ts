import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import {
  addImported,
  createGame,
  exportGame,
  inputsFingerprint,
  isDefaultInputs,
  isNewerStorage,
  maxNameLength,
  overwriteWithImport,
  parseGames,
  parseImport,
  planImport,
  removeGame,
  serializeGames,
  type Game,
  type GamesState,
  type ImportPlan,
} from '../models/games';

/**
 * Storage key in the visitor's browser.
 */
export const gamesStorageKey = 'anno2070rechner:games';

/**
 * Why games are not saved: `blocked` if the browser does not allow it, `newer` if the stored
 * games come from a newer version of the site.
 */
export type StorageError = 'blocked' | 'newer';

/**
 * What the visitor is told about each storage error, as German texts to translate.
 */
export const storageErrorTexts: Record<StorageError, string> = {
  blocked:
    'Dieser Browser erlaubt kein Speichern. Deine Eingaben gehen beim Schließen verloren. Erlaube Website-Daten für diese Seite, um sie zu behalten.',
  newer:
    'Deine Spiele wurden mit einer neueren Version der Seite gespeichert. Lade die Seite neu, damit deine Eingaben wieder gespeichert werden.',
};

/**
 * The outcome of an import that the visitor may have to decide on.
 */
export type ImportOutcome =
  { kind: 'invalid' | 'newer' | 'added' | 'same' } | { kind: 'conflict'; game: Omit<Game, 'usedAt'>; existing: Game };

/**
 * Reads the stored games. Browsers can block the storage altogether.
 *
 * @returns The stored text, or null.
 */
function readStored(): string | undefined {
  try {
    return globalThis.localStorage.getItem(gamesStorageKey) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * The saved games of the population calculator. There is always a current game, whose
 * changes are saved automatically in the browser.
 */
export const useGamesStore = defineStore('games', () => {
  const stored = readStored();
  const state = ref<GamesState>(parseGames(stored, new Date()));

  /**
   * Why the games are not saved: the browser does not allow it, or the stored games come from
   * a newer version of the site, which this one must not overwrite.
   */
  const storageError = ref<StorageError | undefined>(isNewerStorage(stored) ? 'newer' : undefined);

  /**
   * Whether changes are saved.
   */
  const storageWorks = computed(() => storageError.value === undefined);

  /**
   * Changes when the current game was replaced, so that the calculator starts over with it.
   */
  const revision = ref(0);

  let written = '';

  /**
   * Saves the games if they changed.
   */
  function persist(): void {
    if (storageError.value === 'newer') return;
    const text = serializeGames(state.value);
    if (text === written) return;
    written = text;
    try {
      globalThis.localStorage.setItem(gamesStorageKey, text);
      storageError.value = undefined;
    } catch {
      storageError.value = 'blocked';
    }
  }
  persist();
  watch(state, persist, { deep: true });

  const current = computed<Game>(
    () => state.value.games.find(game => game.id === state.value.currentId) ?? state.value.games[0],
  );

  /**
   * Whether the current game has inputs that differ from the defaults.
   */
  const hasInputs = computed(() => !isDefaultInputs(current.value.inputs));

  // Only real changes count, not the productivities of 100 % the calculator fills in.
  watch(
    () => [current.value.id, inputsFingerprint(current.value.inputs)],
    ([id], [previousId]) => {
      if (id === previousId) current.value.updatedAt = Date.now();
    },
  );

  // Other tabs follow the same games. A tab of a newer version keeps them in its format, which
  // this one leaves alone.
  globalThis.addEventListener('storage', event => {
    if (event.key !== gamesStorageKey) return;
    if (isNewerStorage(event.newValue)) {
      storageError.value = 'newer';
      return;
    }
    if (storageError.value === 'newer') storageError.value = undefined;
    state.value = parseGames(event.newValue, new Date());
    written = event.newValue ?? '';
    revision.value++;
  });

  /**
   * Opens a game.
   *
   * @param id - The game.
   */
  function open(id: string): void {
    const game = state.value.games.find(entry => entry.id === id);
    if (!game) return;
    game.usedAt = Date.now();
    state.value.currentId = id;
    revision.value++;
  }

  /**
   * Starts an empty game; the current one stays saved.
   */
  function startNew(): void {
    const game = createGame(state.value.games, new Date());
    state.value.games.push(game);
    state.value.currentId = game.id;
    revision.value++;
  }

  /**
   * Renames a game. Without a name, it is named after its start date again.
   *
   * @param id - The game.
   * @param name - The new name.
   */
  function rename(id: string, name: string): void {
    const game = state.value.games.find(entry => entry.id === id);
    if (!game) return;
    const given = name.trim().slice(0, maxNameLength);
    if (given) game.name = given;
    else delete game.name;
  }

  /**
   * Deletes a game.
   *
   * @param id - The game.
   */
  function remove(id: string): void {
    const wasCurrent = id === state.value.currentId;
    removeGame(state.value, id, new Date());
    if (wasCurrent) revision.value++;
  }

  /**
   * The current game as text for another browser.
   *
   * @returns The text.
   */
  const exportCurrent = (): string => exportGame(current.value);

  /**
   * Imports a game from an exported text. A different version of an existing game changes
   * nothing yet and has to be resolved by the visitor.
   *
   * @param text - The exported text.
   * @returns The outcome.
   */
  function importText(text: string): ImportOutcome {
    const parsed = parseImport(text);
    if (parsed.kind !== 'game') return { kind: parsed.kind };
    const plan: ImportPlan = planImport(state.value, parsed.game);
    if (plan.kind === 'conflict') return { kind: 'conflict', game: parsed.game, existing: plan.existing };
    if (plan.kind === 'same') {
      open(plan.existing.id);
      return { kind: 'same' };
    }
    addImported(state.value, parsed.game, new Date());
    revision.value++;
    return { kind: 'added' };
  }

  /**
   * Replaces an existing game with its imported version.
   *
   * @param game - The imported game.
   */
  function overwrite(game: Omit<Game, 'usedAt'>): void {
    overwriteWithImport(state.value, game, new Date());
    revision.value++;
  }

  /**
   * Adds an imported game as a copy with its own id.
   *
   * @param game - The imported game.
   */
  function addCopy(game: Omit<Game, 'usedAt'>): void {
    addImported(state.value, game, new Date(), true);
    revision.value++;
  }

  return {
    state,
    storageError,
    storageWorks,
    revision,
    current,
    hasInputs,
    open,
    startNew,
    rename,
    remove,
    exportCurrent,
    importText,
    overwrite,
    addCopy,
  };
});
