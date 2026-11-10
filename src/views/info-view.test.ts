import { afterEach, describe, expect, it } from 'vitest';

import { mountPage } from '../tests/mount-page';

const { document } = globalThis;

afterEach(() => {
  document.body.replaceChildren();
});

describe('info page', () => {
  it('links Wikipedia in the language of the page', async () => {
    const german = await mountPage('/info');
    expect(german.wrapper.find('a[title="Anno 2070"]').attributes('href')).toBe(
      'https://de.wikipedia.org/wiki/Anno_2070',
    );
    expect(german.wrapper.find('a[title="Ubisoft"]').attributes('href')).toBe('https://de.wikipedia.org/wiki/Ubisoft');

    const english = await mountPage('/info/en');
    expect(english.wrapper.find('a[title="Anno 2070"]').attributes('href')).toBe(
      'https://en.wikipedia.org/wiki/Anno_2070',
    );
    expect(english.wrapper.find('h3').text()).toBe('Legal');
  });

  it('links the imprint, the license with the year of creation and the repository', async () => {
    const { wrapper } = await mountPage('/info');
    const links = wrapper.findAll('.info-legal a').map(link => link.attributes('href'));
    expect(links).toEqual([
      'https://simbo.de/imprint',
      'https://simbo.mit-license.org/@2011/',
      'https://github.com/simbo/Anno2070Rechner.de',
      '/fonts/Prototype.txt',
    ]);
  });
});
