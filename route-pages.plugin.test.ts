// @vitest-environment node
import type { Rollup } from 'vite';
import { describe, expect, it, vi } from 'vitest';

import { headMarker, renderHead, renderRobots, renderSitemap, routePagesPlugin } from './route-pages.plugin.ts';
import { required } from './src/tests/required.ts';

describe('renderHead', () => {
  it('renders title, description, canonical link, alternates and preview tags', () => {
    const head = renderHead('Datenbank', 'de', { de: '/database', en: '/database/en' });
    expect(head).toContain('<title>Datenbank « Anno 2070 Rechner</title>');
    expect(head).toContain('<link rel="canonical" href="https://anno2070rechner.de/database" />');
    expect(head).toContain('<link rel="alternate" hreflang="en" href="https://anno2070rechner.de/database/en" />');
    expect(head).toContain('<meta property="og:locale" content="de_DE" />');
    expect(head).toContain('content="Online Rechner- und Datenbank-Tool für Anno 2070"');
  });

  it('omits URLs for pages without one and escapes text', () => {
    const head = renderHead('A & "B"', 'en');
    expect(head).not.toContain('canonical');
    expect(head).toContain('<title>A &amp; &quot;B&quot; « Anno 2070 Rechner</title>');
  });
});

describe('search engine files', () => {
  it('lists every page in both languages with alternates and without parameters', () => {
    const sitemap = renderSitemap();
    expect(sitemap.match(/<loc>/g)).toHaveLength(8);
    expect(sitemap).toContain('<loc>https://anno2070rechner.de/database/en</loc>');
    expect(sitemap).toContain('hreflang="de" href="https://anno2070rechner.de/database"');
    expect(sitemap.slice(sitemap.indexOf('<urlset'))).not.toContain('?');
  });

  it('allows everything and names the sitemap', () => {
    expect(renderRobots()).toBe('User-agent: *\nAllow: /\n\nSitemap: https://anno2070rechner.de/sitemap.xml\n');
  });
});

describe('routePagesPlugin', () => {
  interface Emitted {
    fileName: string;
    source: string;
  }

  /**
   * Runs the plugin's bundle hook on a fake bundle.
   *
   * @param source - The built index.html.
   * @returns The emitted files and the changed index.html.
   */
  function run(source: string): { emitted: Emitted[]; index: { source: string } } {
    const emitted: Emitted[] = [];
    const index = { type: 'asset', fileName: 'index.html', source };
    const plugin = routePagesPlugin();
    const hook = plugin.generateBundle as {
      handler: (this: unknown, options: unknown, bundle: Rollup.OutputBundle) => void;
    };
    // A minimal fake bundle: the plugin only reads the type and source of index.html.
    const bundle = Object.fromEntries([['index.html', index]]) as Rollup.OutputBundle;
    hook.handler.call({ emitFile: (file: Emitted) => void emitted.push(file) }, {}, bundle);
    return { emitted, index };
  }

  it('emits one page per route and language plus 404 pages', () => {
    const { emitted, index } = run(`<html lang="de"><head>${headMarker}</head><body></body></html>`);
    const files = emitted.map(file => file.fileName).toSorted((a, b) => a.localeCompare(b));
    expect(files).toEqual([
      '404.en.html',
      '404.html',
      'commoditychains/en/index.html',
      'commoditychains/index.html',
      'database/en/index.html',
      'database/index.html',
      'info/en/index.html',
      'info/index.html',
      'population/en/index.html',
      'population/index.html',
      'robots.txt',
      'sitemap.xml',
    ]);
    const english = required(emitted.find(file => file.fileName === 'database/en/index.html')).source;
    expect(english).toContain('<html lang="en"');
    expect(english).toContain('<title>Database « Anno 2070 Rechner</title>');
    expect(required(emitted.find(file => file.fileName === '404.en.html')).source).toContain('Page not found');
    expect(index.source).toContain('<title>Bevölkerung « Anno 2070 Rechner</title>');
  });

  it('fails without placeholder and skips outputs without index.html', () => {
    expect(() => run('<html lang="de"></html>')).toThrow(/lacks/);
    const plugin = routePagesPlugin();
    const hook = plugin.generateBundle as {
      handler: (this: unknown, options: unknown, bundle: Rollup.OutputBundle) => void;
    };
    const emitFile = vi.fn();
    hook.handler.call({ emitFile }, {}, {});
    expect(emitFile).not.toHaveBeenCalled();
  });
});
