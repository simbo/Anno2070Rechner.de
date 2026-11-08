import { describe, expect, it } from 'vitest';

import {
  addImported,
  createGame,
  defaultInputs,
  exportGame,
  formatDay,
  gameName,
  gamesByUse,
  inputsFingerprint,
  isDefaultInputs,
  overwriteWithImport,
  parseGames,
  parseImport,
  planImport,
  removeGame,
  type Game,
  type GamesState,
} from './games';

const now = new Date(2026, 10, 8, 12);
const later = new Date(2026, 10, 12, 12);

/**
 * A state with the given number of games.
 *
 * @param count - The number of games.
 * @returns The state, whose current game is the first.
 */
function stateWith(count: number): GamesState {
  const games: Game[] = [];
  for (let index = 0; index < count; index++) {
    games.push({ ...createGame(games, now), usedAt: index });
  }
  return { currentId: games[0].id, games };
}

describe('defaults', () => {
  it('are the defaults of the old calculator', () => {
    const defaults = defaultInputs();
    expect(defaults.maxUpgrade).toEqual({ ecos: '4', tycoons: '4', techs: '2' });
    expect(defaults.residences.techs).toHaveLength(3);
    expect(defaults.ccTarget).toBe('0');
  });
});

describe('inputsFingerprint', () => {
  it('ignores productivities of 100 %, which the calculator fills in', () => {
    const inputs = defaultInputs();
    inputs.productivity['10045'] = '100';
    expect(isDefaultInputs(inputs)).toBe(true);
    inputs.productivity['10045'] = '150';
    expect(isDefaultInputs(inputs)).toBe(false);
  });

  it('notices every kind of input', () => {
    const change: ((inputs: ReturnType<typeof defaultInputs>) => void)[] = [
      inputs => (inputs.residences.ecos[1] = '5'),
      inputs => (inputs.inhabitants.techs[1] = '5'),
      inputs => (inputs.maxUpgrade.ecos = '2'),
      inputs => (inputs.info.ecos = '1'),
      inputs => (inputs.ccTarget = '1'),
      inputs => (inputs.chains['10186'] = { productivity: {}, preferred: [10_186] }),
    ];
    for (const apply of change) {
      const inputs = defaultInputs();
      apply(inputs);
      expect(isDefaultInputs(inputs)).toBe(false);
    }
  });

  it('does not depend on the order of the entries', () => {
    const first = defaultInputs();
    first.productivity = { '10045': '150', '10037': '50' };
    const second = defaultInputs();
    second.productivity = { '10037': '50', '10045': '150' };
    expect(inputsFingerprint(first)).toBe(inputsFingerprint(second));
  });
});

describe('names', () => {
  it('follow the start date and the language', () => {
    const game = createGame([], now);
    expect(gameName(game, 'de')).toBe('Spiel vom 08.11.2026');
    expect(gameName(game, 'en')).toBe('Game from Nov 8, 2026');
  });

  it('count the games of a day', () => {
    const first = createGame([], now);
    const second = createGame([first], now);
    expect(gameName(second, 'de')).toBe('Spiel vom 08.11.2026 (2)');
    expect(createGame([first, second], later).number).toBe(1);
  });

  it('prefer the given name', () => {
    expect(gameName({ ...createGame([], now), name: 'Meine Stadt' }, 'en')).toBe('Meine Stadt');
  });

  it('format days per language', () => {
    expect(formatDay('2026-01-05', 'de')).toBe('05.01.2026');
    expect(formatDay('2026-01-05', 'en')).toBe('Jan 5, 2026');
  });
});

describe('gamesByUse', () => {
  it('sorts the most recently used game first', () => {
    const { games } = stateWith(3);
    expect(gamesByUse(games).map(game => game.usedAt)).toEqual([2, 1, 0]);
  });
});

describe('parseGames', () => {
  it('starts a new game without valid data', () => {
    for (const raw of [null, 'not json', '{}', '{"games":"x"}', '{"games":[{"id":"x"}]}']) {
      const state = parseGames(raw, now);
      expect(state.games).toHaveLength(1);
      expect(state.currentId).toBe(state.games[0].id);
    }
  });

  it('restores stored games and the current one', () => {
    const state = stateWith(2);
    state.currentId = state.games[1].id;
    state.games[1].inputs.residences.ecos[1] = '7';
    expect(parseGames(JSON.stringify(state), now)).toEqual(state);
  });

  it('leaves out damaged games and keeps the others', () => {
    const state = stateWith(2);
    const stored = { ...state, games: [state.games[0], { ...state.games[1], inputs: {} }] };
    const parsed = parseGames(JSON.stringify(stored), now);
    expect(parsed.games.map(game => game.id)).toEqual([state.games[0].id]);
  });

  it('opens the most recently used game if the current one is gone', () => {
    const state = stateWith(2);
    const parsed = parseGames(JSON.stringify({ ...state, currentId: 'gone' }), now);
    expect(parsed.currentId).toBe(state.games[1].id);
  });
});

describe('removeGame', () => {
  it('keeps the current game when removing another one', () => {
    const state = stateWith(2);
    const current = state.currentId;
    removeGame(state, state.games[1].id, later);
    expect(state.currentId).toBe(current);
    expect(state.games).toHaveLength(1);
  });

  it('opens the most recently used game after removing the current one', () => {
    const state = stateWith(3);
    const expected = state.games[2].id;
    removeGame(state, state.currentId, later);
    expect(state.currentId).toBe(expected);
  });

  it('leaves an empty game after removing the only one', () => {
    const state = stateWith(1);
    state.games[0].inputs.ccTarget = '1';
    const removed = state.currentId;
    removeGame(state, removed, later);
    expect(state.games).toHaveLength(1);
    expect(state.currentId).not.toBe(removed);
    expect(isDefaultInputs(state.games[0].inputs)).toBe(true);
  });
});

describe('export and import', () => {
  const game = (): Game => {
    const entry = { ...createGame([], now), name: 'Größe & Glück' };
    entry.inputs.residences.ecos[1] = '12';
    return entry;
  };

  it('survive a round trip, also with umlauts in the name', () => {
    const original = game();
    const { usedAt, ...expected } = original;
    expect(usedAt).toBe(now.getTime());
    expect(parseImport(exportGame(original))).toEqual({ kind: 'game', game: expected });
  });

  it('ignore surrounding whitespace', () => {
    const text = exportGame(game());
    expect(parseImport(`\n ${text} \n`).kind).toBe('game');
  });

  it('reject invalid texts', () => {
    const damaged = globalThis.btoa('{"id":"x"}');
    for (const text of ['', 'x', 'anno2070:1', 'anno2070:1:###', `anno2070:1:${damaged}`]) {
      expect(parseImport(text)).toEqual({ kind: 'invalid' });
    }
  });

  it('reject texts of a newer format', () => {
    const text = exportGame(game()).replace('anno2070:1:', 'anno2070:2:');
    expect(parseImport(text)).toEqual({ kind: 'newer' });
  });

  it('add a game with an unknown id', () => {
    const state = stateWith(1);
    const imported = game();
    expect(planImport(state, imported)).toEqual({ kind: 'add' });
    addImported(state, imported, later);
    expect(state.currentId).toBe(imported.id);
    expect(state.games).toHaveLength(2);
  });

  it('keep names and day counters unique when adding', () => {
    const state = stateWith(1);
    state.games[0].name = 'Größe & Glück';
    addImported(state, game(), later);
    expect(state.games[1].name).toBe('Größe & Glück (2)');
    addImported(state, createGame([], now), later);
    expect(state.games[2].number).toBe(2);
  });

  it('recognize the same content of a known game', () => {
    const state = stateWith(1);
    const imported = { ...state.games[0] };
    expect(planImport(state, imported)).toEqual({ kind: 'same', existing: state.games[0] });
  });

  it('report a different version of a known game without changing it', () => {
    const state = stateWith(1);
    const imported = { ...state.games[0], inputs: { ...defaultInputs(), ccTarget: '1' } };
    expect(planImport(state, imported)).toEqual({ kind: 'conflict', existing: state.games[0] });
    expect(isDefaultInputs(state.games[0].inputs)).toBe(true);
  });

  it('overwrite a known game on request', () => {
    const state = stateWith(2);
    const target = state.games[1];
    overwriteWithImport(state, { ...target, inputs: { ...defaultInputs(), ccTarget: '1' } }, later);
    expect(state.currentId).toBe(target.id);
    expect(state.games).toHaveLength(2);
    expect(state.games[1].inputs.ccTarget).toBe('1');
  });

  it('add a copy with its own id on request', () => {
    const state = stateWith(1);
    const imported = { ...state.games[0], inputs: { ...defaultInputs(), ccTarget: '1' } };
    addImported(state, imported, later, true);
    expect(state.games).toHaveLength(2);
    expect(state.games[1].id).not.toBe(state.games[0].id);
    expect(state.currentId).toBe(state.games[1].id);
    expect(isDefaultInputs(state.games[0].inputs)).toBe(true);
  });
});
