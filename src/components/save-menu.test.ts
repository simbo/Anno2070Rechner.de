import { flushPromises, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useGamesStore } from '../stores/games';
import { mountPage } from '../tests/mount-page';
import { required } from '../tests/required';

const { document, localStorage } = globalThis;

const icon = (wrapper: VueWrapper): ReturnType<VueWrapper['find']> => wrapper.find('.user-menu li.save a');
const rows = (wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> => wrapper.findAll('#save-menu li');

/**
 * Mounts a page with the save menu opened.
 *
 * @param path - The page.
 * @returns The page.
 */
async function openMenu(path = '/population'): Promise<Awaited<ReturnType<typeof mountPage>>> {
  const page = await mountPage(path);
  await icon(page.wrapper).trigger('click');
  return page;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  document.body.replaceChildren();
});

/**
 * Enters a text in the import field and imports it.
 *
 * @param wrapper - The page.
 * @param text - The text.
 */
async function runImport(wrapper: VueWrapper, text: string): Promise<void> {
  await wrapper.find('#save-menu button.import').trigger('click');
  await wrapper.find('.save-menu-text').setValue(text);
  await wrapper.find('.save-menu-buttons input').trigger('click');
  await flushPromises();
}

/**
 * Imports an older version of the current game, which has been changed since.
 *
 * @param wrapper - The page.
 * @returns The store.
 */
async function importOther(wrapper: VueWrapper): Promise<ReturnType<typeof useGamesStore>> {
  const games = useGamesStore();
  const text = games.exportCurrent();
  games.current.inputs.residences.ecos[0] = '99';
  await flushPromises();
  await runImport(wrapper, text);
  return games;
}

describe('save icon', () => {
  it('has no check with default values', async () => {
    const { wrapper } = await mountPage('/population');
    expect(wrapper.find('li.save').classes()).not.toContain('saved');
  });

  it('gets a check once the game has inputs, also on other pages', async () => {
    const { wrapper } = await mountPage('/database');
    useGamesStore().current.inputs.residences.ecos[1] = '3';
    await flushPromises();
    expect(wrapper.find('li.save').classes()).toContain('saved');
  });

  it('gets no check from opening a box', async () => {
    const { wrapper } = await mountPage('/population');
    await wrapper.find('#display-options .show_demands').trigger('click');
    await flushPromises();
    expect(wrapper.find('li.save').classes()).not.toContain('saved');
  });
});

describe('save menu', () => {
  it('explains itself and marks the current game', async () => {
    const { wrapper } = await openMenu();
    expect(wrapper.find('#save-menu p').text()).toBe('Automatisch im Browser gespeichert.');
    expect(rows(wrapper)).toHaveLength(1);
    expect(rows(wrapper)[0].classes()).toContain('ui-selectmenu-item-selected');
    expect(rows(wrapper)[0].find('a').text()).toMatch(/^Spiel vom \d{2}\.\d{2}\.\d{4}$/);
  });

  it('closes on Escape and on a click elsewhere', async () => {
    const { wrapper } = await openMenu();
    await wrapper.find('#save-chooser').trigger('keydown', { key: 'Escape' });
    expect(wrapper.find('#save-menu').exists()).toBe(false);
    await icon(wrapper).trigger('click');
    document.body.click();
    await flushPromises();
    expect(wrapper.find('#save-menu').exists()).toBe(false);
  });

  it('starts a new game and keeps the old one', async () => {
    const { wrapper } = await openMenu();
    const games = useGamesStore();
    const first = games.current.id;
    games.current.inputs.residences.ecos[1] = '3';
    await wrapper.find('.save-menu-new').trigger('click');
    await flushPromises();
    expect(games.state.games).toHaveLength(2);
    expect(games.current.id).not.toBe(first);
    expect(wrapper.find('li.save').classes()).not.toContain('saved');
    await icon(wrapper).trigger('click');
    expect(rows(wrapper)[1].find('a').text()).toMatch(/\d{4}$/);
    expect(rows(wrapper)[0].find('a').text()).toMatch(/\(2\)$/);
  });

  it('switches games, and the calculator shows the other one', async () => {
    const { wrapper } = await openMenu();
    const games = useGamesStore();
    const first = games.current.id;
    games.current.inputs.residences.ecos[0] = '77';
    await wrapper.find('.save-menu-new').trigger('click');
    await flushPromises();
    expect(wrapper.find('input[name="ecos0r"]').element).toHaveProperty('value', '0');
    await icon(wrapper).trigger('click');
    await required(rows(wrapper).at(1)).find('a').trigger('click');
    await flushPromises();
    expect(games.current.id).toBe(first);
    expect(wrapper.find('input[name="ecos0r"]').element).toHaveProperty('value', '77');
  });

  it('leads to the calculator when a game is chosen on another page', async () => {
    const { wrapper, router } = await openMenu('/database/en');
    await wrapper.find('.save-menu-new').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/population/en');
  });

  it('renames a game inline, and Escape keeps the old name', async () => {
    const { wrapper } = await openMenu();
    await wrapper.find('#save-menu button.rename').trigger('click');
    const input = wrapper.find('.save-menu-rename');
    await input.setValue('Meine Stadt');
    await input.trigger('keydown', { key: 'Enter' });
    expect(rows(wrapper)[0].find('a').text()).toBe('Meine Stadt');
    await wrapper.find('#save-menu button.rename').trigger('click');
    await wrapper.find('.save-menu-rename').setValue('Anders');
    await wrapper.find('.save-menu-rename').trigger('keydown', { key: 'Escape' });
    expect(rows(wrapper)[0].find('a').text()).toBe('Meine Stadt');
  });

  it('goes back to the date when the name is emptied', async () => {
    const { wrapper } = await openMenu();
    const games = useGamesStore();
    games.rename(games.current.id, 'Meine Stadt');
    await flushPromises();
    await wrapper.find('#save-menu button.rename').trigger('click');
    await wrapper.find('.save-menu-rename').setValue('  ');
    await wrapper.find('.save-menu-rename').trigger('keydown', { key: 'Enter' });
    expect(rows(wrapper)[0].find('a').text()).toMatch(/^Spiel vom/);
  });

  it('keeps an automatic name automatic when renaming is left unchanged', async () => {
    const { wrapper } = await openMenu();
    await wrapper.find('#save-menu button.rename').trigger('click');
    await wrapper.find('.save-menu-rename').trigger('keydown', { key: 'Enter' });
    expect(useGamesStore().current.name).toBeUndefined();
  });

  it('asks before deleting, then opens the next game', async () => {
    const { wrapper } = await openMenu();
    const games = useGamesStore();
    const first = games.current.id;
    games.current.inputs.residences.ecos[0] = '77';
    games.startNew();
    await flushPromises();
    await required(rows(wrapper).at(0)).find('button.delete').trigger('click');
    await required(wrapper.findAll('.save-menu-confirm input').at(1)).trigger('click');
    expect(games.state.games).toHaveLength(2);
    await required(rows(wrapper).at(0)).find('button.delete').trigger('click');
    await wrapper.find('.save-menu-confirm input').trigger('click');
    await flushPromises();
    expect(games.state.games).toHaveLength(1);
    expect(games.current.id).toBe(first);
    expect(wrapper.find('input[name="ecos0r"]').element).toHaveProperty('value', '77');
  });
});

describe('export and import', () => {
  it('shows the current game as text', async () => {
    const { wrapper } = await openMenu();
    await wrapper.find('#save-menu button.export').trigger('click');
    await flushPromises();
    const text = (wrapper.find('.save-menu-text').element as HTMLTextAreaElement).value;
    expect(text).toMatch(/^anno2070:1:/);
    await wrapper.find('.save-menu-buttons input').trigger('click');
    expect(rows(wrapper)).toHaveLength(1);
  });

  it('reports an invalid text and changes nothing', async () => {
    const { wrapper } = await openMenu();
    await runImport(wrapper, 'nonsense');
    expect(wrapper.find('.save-menu-message').text()).toContain('kein gültiges Spiel');
    expect(useGamesStore().state.games).toHaveLength(1);
  });

  it('adds a game from another browser and opens it', async () => {
    const { wrapper } = await openMenu();
    const games = useGamesStore();
    games.current.inputs.residences.ecos[0] = '55';
    const text = games.exportCurrent();
    games.remove(games.current.id);
    await flushPromises();
    await runImport(wrapper, text);
    expect(games.state.games).toHaveLength(2);
    expect(wrapper.find('input[name="ecos0r"]').element).toHaveProperty('value', '55');
    expect(wrapper.find('#save-menu').exists()).toBe(false);
  });

  it('says so for a game that is already there', async () => {
    const { wrapper } = await openMenu();
    const games = useGamesStore();
    await runImport(wrapper, games.exportCurrent());
    expect(wrapper.find('.save-menu-message').text()).toContain('schon vorhanden');
    expect(games.state.games).toHaveLength(1);
  });

  describe('with another version of an existing game', () => {
    it('asks and changes nothing yet', async () => {
      const { wrapper } = await openMenu();
      const games = await importOther(wrapper);
      expect(wrapper.find('#save-menu p').text()).toContain('gibt es hier schon');
      expect(games.current.inputs.residences.ecos[0]).toBe('99');
      await required(wrapper.findAll('.save-menu-buttons input').at(2)).trigger('click');
      expect(games.current.inputs.residences.ecos[0]).toBe('99');
      expect(rows(wrapper)).toHaveLength(1);
    });

    it('overwrites on request', async () => {
      const { wrapper } = await openMenu();
      const games = await importOther(wrapper);
      await required(wrapper.findAll('.save-menu-buttons input').at(0)).trigger('click');
      await flushPromises();
      expect(games.state.games).toHaveLength(1);
      expect(games.current.inputs.residences.ecos[0]).toBe('0');
      expect(wrapper.find('input[name="ecos0r"]').element).toHaveProperty('value', '0');
    });

    it('adds a copy on request', async () => {
      const { wrapper } = await openMenu();
      const games = await importOther(wrapper);
      await required(wrapper.findAll('.save-menu-buttons input').at(1)).trigger('click');
      await flushPromises();
      expect(games.state.games).toHaveLength(2);
      expect(games.state.games[0].inputs.residences.ecos[0]).toBe('99');
      expect(games.current.inputs.residences.ecos[0]).toBe('0');
    });
  });
});

describe('storage', () => {
  it('survives a reload', async () => {
    const first = await openMenu();
    useGamesStore().current.inputs.residences.ecos[0] = '42';
    await flushPromises();
    first.wrapper.unmount();
    const { wrapper } = await mountPage('/population');
    expect(wrapper.find('input[name="ecos0r"]').element).toHaveProperty('value', '42');
  });
});
