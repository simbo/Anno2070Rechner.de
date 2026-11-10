/**
 * The single route table of the site. The router, the generated HTML pages and the
 * navigation all read from it. It must stay free of browser and Vue.js imports because
 * the Vite configuration uses it at build time.
 */

/**
 * Supported languages. German is the default and has no path suffix.
 */
export const languages = ['de', 'en'] as const;

/**
 * A supported language code.
 */
export type Language = (typeof languages)[number];

/**
 * The language used for paths without a language suffix.
 */
export const defaultLanguage: Language = 'de';

/**
 * Page identifiers. They are also the first path segment and the body class.
 */
export type PageId = 'population' | 'commoditychains' | 'database' | 'info';

/**
 * A page of the site with its localized titles.
 */
export interface Page {
  id: PageId;
  title: Record<Language, string>;
}

/**
 * All pages in navigation order.
 */
export const pages: readonly Page[] = [
  { id: 'population', title: { de: 'Bevölkerung', en: 'Population' } },
  { id: 'commoditychains', title: { de: 'Produktionsketten', en: 'Commodity chains' } },
  { id: 'database', title: { de: 'Datenbank', en: 'Database' } },
  { id: 'info', title: { de: 'Info', en: 'Info' } },
];

/**
 * Title of the 404 page.
 */
export const notFoundTitle: Record<Language, string> = { de: 'Seite nicht gefunden', en: 'Page not found' };

/**
 * Name of the site, shown after the page title.
 */
export const siteTitle = 'Anno 2070 Rechner';

/**
 * Public origin of the site, used for canonical and preview URLs.
 */
export const siteUrl = 'https://anno2070rechner.de';

/**
 * Address of a page on simbo.de in a language. GitHub Pages serves these folders only with a
 * trailing slash.
 *
 * @param page - The folder of the page.
 * @param language - The language of the page.
 * @returns The address.
 */
const simboPage = (page: string, language: Language): string =>
  `https://simbo.de/${page}/${language === defaultLanguage ? '' : `${language}/`}`;

/**
 * Imprint of the author, shared by all of the author's sites.
 *
 * @param language - The language of the page.
 * @returns The address.
 */
export const imprintUrl = (language: Language): string => simboPage('imprint', language);

/**
 * Privacy notice of the author, shared by all of the author's sites. Its section `#analytics`
 * describes the visitor statistics.
 *
 * @param language - The language of the page.
 * @returns The address.
 */
export const privacyUrl = (language: Language): string => simboPage('privacy', language);

/**
 * Short description for search engines and link previews.
 */
export const siteDescription: Record<Language, string> = {
  de: 'Online Rechner- und Datenbank-Tool für Anno 2070',
  en: 'Online calculator and database tool for Anno 2070',
};

/**
 * Builds the path of a page in a language, like the old site: `/database` or `/database/en`.
 *
 * @param page - The page id.
 * @param language - The language of the page.
 * @returns The absolute path without a trailing slash.
 */
export function pagePath(page: PageId, language: Language): string {
  return language === defaultLanguage ? `/${page}` : `/${page}/${language}`;
}

/**
 * Builds the document title like the old site: `Bevölkerung « Anno 2070 Rechner`.
 *
 * @param title - The page title.
 * @returns The full document title.
 */
export function documentTitle(title: string): string {
  return `${title} « ${siteTitle}`;
}
