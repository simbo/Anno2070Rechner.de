import {
  createRouter,
  type RouteLocationNormalized,
  type Router,
  type RouteRecordRaw,
  type RouteRecordSingleView,
  type RouterHistory,
} from 'vue-router';

import { ensureCatalog } from './catalog';
import { flatten } from './lib/compat';
import {
  defaultLanguage,
  documentTitle,
  languages,
  notFoundTitle,
  pagePath,
  pages,
  type Language,
  type PageId,
} from './routes';

declare module 'vue-router' {
  interface RouteMeta {
    language: Language;
    page?: PageId;
  }
}

const views: Record<PageId, RouteRecordSingleView['component']> = {
  population: async () => import('./views/population-view.vue'),
  commoditychains: async () => import('./views/commoditychains-view.vue'),
  database: async () => import('./views/database-view.vue'),
  info: async () => import('./views/info-view.vue'),
};

const pageRoutes: RouteRecordRaw[] = flatten(
  pages.map(page =>
    languages.map(language => ({
      path: pagePath(page.id, language),
      name: `${page.id}-${language}`,
      component: views[page.id],
      meta: { language, page: page.id },
    })),
  ),
);

/**
 * Routes of the site: one per page and language, the redirects of the old site and a
 * 404 page whose language follows a trailing `/en`.
 */
export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: pagePath('population', defaultLanguage) },
  ...languages
    .filter(language => language !== defaultLanguage)
    .map(language => ({ path: `/${language}`, redirect: pagePath('population', language) })),
  ...pageRoutes,
  // A suffix for the default language is dropped, like the old site did.
  { path: `/:rest(.*)/${defaultLanguage}`, redirect: to => ({ path: `/${String(to.params.rest)}`, query: to.query }) },
  {
    path: '/:path(.*)/en',
    name: 'not-found-en',
    component: async () => import('./views/not-found-view.vue'),
    meta: { language: 'en' },
  },
  {
    path: '/:path(.*)',
    name: 'not-found',
    component: async () => import('./views/not-found-view.vue'),
    meta: { language: defaultLanguage },
  },
];

/**
 * Keeps title, language and the page's body class in sync, as the old server rendered them.
 *
 * @param to - The shown route.
 */
export function updateDocument(to: RouteLocationNormalized): void {
  const { document } = globalThis;
  const page = pages.find(entry => entry.id === to.meta.page);
  const title = page ? page.title[to.meta.language] : notFoundTitle[to.meta.language];
  document.title = documentTitle(title);
  document.documentElement.lang = to.meta.language;
  const background = [...document.body.classList].filter(name => name.startsWith('bg-'));
  document.body.setAttribute('class', [to.meta.page ?? '_404', ...background].join(' '));
}

/**
 * Creates the router of the site. Pages render game data synchronously, so it is loaded
 * before a route is shown. Like page loads on the old site, a new page starts at the top.
 *
 * @param history - The history implementation.
 * @returns The router.
 */
export function createAppRouter(history: RouterHistory): Router {
  const router = createRouter({ history, routes });
  router.beforeEach(async to => {
    await ensureCatalog(to.meta.language);
  });
  router.afterEach((to, from) => {
    updateDocument(to);
    if (to.path !== from.path) globalThis.scrollTo(0, 0);
  });
  return router;
}
