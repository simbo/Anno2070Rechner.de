import { afterEach, describe, expect, it } from 'vitest';

import { mountPage } from './tests/mount-page';
import { required } from './tests/required';

const { document, setTimeout } = globalThis;

afterEach(() => {
  document.body.replaceChildren();
});

describe('page frame', () => {
  it('shows the navigation with the current page like the old site', async () => {
    const { wrapper } = await mountPage('/database');
    const items = wrapper.findAll('#menu li');
    expect(items.map(item => item.text())).toEqual(['Bevölkerung', 'Produktionsketten', 'Datenbank', 'Info']);
    expect(items.map(item => item.classes())).toEqual([[], [], ['current'], []]);
    expect(wrapper.findAll('#user-menu li').map(item => item.classes())).toEqual([['background']]);
    expect(wrapper.find('#under-development').exists()).toBe(false);
  });

  it('marks the info page as current like every other page', async () => {
    const { wrapper } = await mountPage('/info/en');
    expect(required(wrapper.findAll('#menu li').at(3)).classes()).toEqual(['current']);
    expect(wrapper.find('#menu').text()).toContain('Commodity chains');
    expect(wrapper.find('h2').text()).toBe('Info');
  });

  it('spells the English title of the commodity chains like the menu', async () => {
    await mountPage('/commoditychains/en');
    expect(document.title).toBe('Commodity chains « Anno 2070 Rechner');
  });

  it('links to the same page in both languages', async () => {
    const { wrapper } = await mountPage('/commoditychains/en');
    const links = wrapper.findAll('#lang-select a');
    expect(links.map(link => [link.attributes('href'), link.classes()[0], link.attributes('title')])).toEqual([
      ['/commoditychains', 'de', 'Deutsch (Deutschland)'],
      ['/commoditychains/en', 'en', 'English (US)'],
    ]);
    expect(wrapper.find('#home-link').attributes('href')).toBe('/population/en');
  });

  it('shows the 404 page with links to the start page', async () => {
    const { wrapper } = await mountPage('/missing/en');
    expect(wrapper.find('h2.error').text()).toBe('Oops, something went totally wrong here…');
    expect(wrapper.findAll('#lang-select a').map(link => link.attributes('href'))).toEqual(['/', '/en']);
    expect(document.body.className).toMatch(/^_404 bg-(eco|tycoon)\d$/);
    expect(document.title).toBe('Page not found « Anno 2070 Rechner');
  });

  it('navigates without reloading and updates title, language and body class', async () => {
    const { wrapper, router } = await mountPage('/population');
    await required(wrapper.findAll('#menu a').at(2)).trigger('click');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(router.currentRoute.value.path).toBe('/database');
    expect(document.title).toBe('Datenbank « Anno 2070 Rechner');
    expect(document.body.className).toMatch(/^database bg-(eco|tycoon)\d$/);
    expect(document.documentElement.lang).toBe('de');
    expect(wrapper.find('h2.database').exists()).toBe(true);
  });
});
