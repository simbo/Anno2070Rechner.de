import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mountPage } from '../tests/mount-page';

const { document } = globalThis;

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('database page', () => {
  it('shows the results of the URL parameters', async () => {
    const { wrapper } = await mountPage('/database?search=%C3%96l');
    expect(wrapper.findAll('#database-results h3').map(h3 => h3.text())).toEqual(['Produktionsgebäude', 'Waren']);
    expect(wrapper.findAll('#database-results .building .name').map(name => name.text())).toEqual([
      'Erdölraffinerie',
      'Ölbohrer',
      'Ölplattform',
    ]);
    expect((wrapper.find('input[name=search]').element as HTMLInputElement).value).toBe('Öl');
  });

  it('renders building details with the old spacing and formats', async () => {
    const { wrapper } = await mountPage('/database?productionbuilding=10092');
    const building = wrapper.find('#database-results .building');
    expect(building.findAll('.details').map(details => details.text())).toEqual(['produziert 2 tpm', 'benötigt 3 tpm']);
    expect(building.find('.maintenance-costs').text()).toBe('-15 / -7-2 / -1-4 / -2');
    expect(building.find('a.show-cc').attributes('href')).toBe('/commoditychains?pb_guid=10092');
  });

  it('updates the results from links inside them', async () => {
    const { wrapper, router } = await mountPage('/database/en?productionbuilding=10092');
    await wrapper.find('#database-results a[rel=database]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/database/en?product=2500036');
    expect(wrapper.find('#database-results .product .name').text()).toBe('Oil');
  });

  it('submits the search form', async () => {
    const { wrapper, router } = await mountPage('/database');
    await wrapper.find('input[name=search]').setValue('fisch');
    await wrapper.find('#database-search-form').trigger('submit');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ search: 'fisch' });
    expect(wrapper.findAll('#database-results .name').map(name => name.text())).toEqual(['Fischerei', 'Fisch']);
  });

  it('shows a list chosen in a select box and resets the others', async () => {
    const { wrapper, router } = await mountPage('/database');
    vi.useFakeTimers();
    const buttons = wrapper.findAll('#database-select-form a.ui-selectmenu');
    await buttons[2].trigger('mousedown', { button: 0 });
    await flushPromises();
    const items = document.querySelectorAll('.ui-selectmenu-open li');
    // The plugin ignores the mouse button release of the opening click for 300 ms.
    vi.advanceTimersByTime(400);
    items[1].dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ product: 'all' });
    expect(wrapper.findAll('#database-results .product')).toHaveLength(67);
  });

  it('suggests names while typing', async () => {
    vi.useFakeTimers();
    const { wrapper } = await mountPage('/database');
    const search = wrapper.find('input[name=search]');
    await search.setValue('a');
    await search.trigger('keydown', { key: 'a' });
    vi.advanceTimersByTime(300);
    await flushPromises();
    const items = [...document.querySelectorAll('.ui-autocomplete li')].map(item => item.textContent);
    expect(items).toEqual([
      'Abfertigungsterminal',
      'Akademie',
      'Algen',
      'Aquafarm',
      'Aromastoffproduktion',
      'Atomkraftwerk',
    ]);
  });
});
