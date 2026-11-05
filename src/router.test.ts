import { describe, expect, it } from 'vitest';
import { createMemoryHistory } from 'vue-router';

import { createAppRouter } from './router';
import { documentTitle, pagePath } from './routes';

const router = createAppRouter(createMemoryHistory());

const resolve = (path: string): { path: string; name: unknown; language: unknown; query: unknown } => {
  const route = router.resolve(path);
  return { path: route.path, name: route.name, language: route.meta.language, query: route.query };
};

describe('routes', () => {
  it('build paths and titles like the old site', () => {
    expect(pagePath('database', 'de')).toBe('/database');
    expect(pagePath('database', 'en')).toBe('/database/en');
    expect(documentTitle('Info')).toBe('Info « Anno 2070 Rechner');
  });

  it('resolve every page in both languages', () => {
    expect(resolve('/population')).toMatchObject({ name: 'population-de', language: 'de' });
    expect(resolve('/commoditychains/en')).toMatchObject({ name: 'commoditychains-en', language: 'en' });
    expect(resolve('/database?product=2500004')).toMatchObject({ name: 'database-de', query: { product: '2500004' } });
  });

  it('show a 404 page in the language of the path', () => {
    expect(resolve('/foo')).toMatchObject({ name: 'not-found', language: 'de' });
    expect(resolve('/foo/en')).toMatchObject({ name: 'not-found-en', language: 'en' });
  });

  it('redirect like the old site', async () => {
    await router.push('/');
    expect(router.currentRoute.value.path).toBe('/population');
    await router.push('/en');
    expect(router.currentRoute.value.path).toBe('/population/en');
    await router.push('/info/de?x=1');
    expect(router.currentRoute.value.fullPath).toBe('/info?x=1');
  });
});
