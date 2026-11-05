import type { Plugin } from 'vite';

import {
  documentTitle,
  languages,
  notFoundTitle,
  pagePath,
  pages,
  siteDescription,
  siteTitle,
  siteUrl,
  type Language,
} from './src/routes.ts';

/**
 * Placeholder in `src/index.html` that is replaced with the route-specific head tags.
 * It is a title element so that the HTML minifier keeps it.
 */
export const headMarker = '<title>route-head</title>';

const escapeHtml = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/**
 * Renders the head tags of one page: title, description, canonical link, language
 * alternates and preview tags.
 *
 * @param title - The page title without the site name.
 * @param language - The language of the page.
 * @param paths - The path of the page per language, or undefined for pages without a URL.
 * @returns The HTML for the document head.
 */
export function renderHead(title: string, language: Language, paths?: Record<Language, string>): string {
  const fullTitle = escapeHtml(documentTitle(title));
  const description = escapeHtml(siteDescription[language]);
  const tags = [
    `<title>${fullTitle}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta property="og:title" content="${fullTitle}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${siteTitle}" />`,
    `<meta property="og:locale" content="${language === 'en' ? 'en_US' : 'de_DE'}" />`,
    `<meta property="og:image" content="${siteUrl}/img/logo.png" />`,
    `<meta name="twitter:card" content="summary" />`,
  ];
  if (paths) {
    tags.push(
      `<link rel="canonical" href="${siteUrl}${paths[language]}" />`,
      `<meta property="og:url" content="${siteUrl}${paths[language]}" />`,
      ...languages.map(code => `<link rel="alternate" hreflang="${code}" href="${siteUrl}${paths[code]}" />`),
    );
  }
  return tags.join('');
}

/**
 * Sets the language attribute of the HTML element.
 *
 * @param html - The HTML document.
 * @param language - The language code.
 * @returns The document with the language set.
 */
const withLanguage = (html: string, language: Language): string =>
  html.replace(/<html lang="[^"]*"/, () => `<html lang="${language}"`);

/**
 * Builds a page from the template: head tags in place of the placeholder, and the language.
 *
 * @param template - The built index.html.
 * @param head - The head tags.
 * @param language - The page language.
 * @returns The page.
 */
const buildPage = (template: string, head: string, language: Language): string =>
  withLanguage(
    template.replace(headMarker, () => head),
    language,
  );

/**
 * Paths of a page in all languages.
 *
 * @param page - The page.
 * @returns The path per language.
 */
const pagePaths = (page: (typeof pages)[number]): Record<Language, string> =>
  Object.fromEntries(languages.map(code => [code, pagePath(page.id, code)])) as Record<Language, string>;

/**
 * Generates one HTML file per page and language from the built `index.html`, plus a
 * `404.html` per language, so every old URL has its own document with the right head.
 * The page content itself is rendered by the client app.
 *
 * @returns The Vite plugin.
 */
export function routePagesPlugin(): Plugin {
  return {
    name: 'route-pages',
    apply: 'build',
    enforce: 'post',
    generateBundle: {
      // Runs after Vite has emitted the processed index.html.
      order: 'post',
      // Rollup provides emitFile() only through the plugin context.

      handler(
        this: { emitFile: (file: { type: 'asset'; fileName: string; source: string }) => void },
        _options,
        bundle,
      ) {
        const index = 'index.html' in bundle ? bundle['index.html'] : undefined;
        if (index?.type !== 'asset' || typeof index.source !== 'string') {
          throw new Error('route-pages: the build did not produce index.html');
        }
        const template = index.source;
        if (!template.includes(headMarker)) throw new Error(`route-pages: index.html lacks ${headMarker}`);
        const emit = (fileName: string, source: string): void => {
          this.emitFile({ type: 'asset', fileName, source });
        };
        for (const page of pages) {
          const paths = pagePaths(page);
          for (const language of languages) {
            emit(
              `${paths[language].slice(1)}/index.html`,
              buildPage(template, renderHead(page.title[language], language, paths), language),
            );
          }
        }
        for (const language of languages) {
          emit(
            language === 'de' ? '404.html' : `404.${language}.html`,
            buildPage(template, renderHead(notFoundTitle[language], language), language),
          );
        }
        // The start page is a redirect on the server; keep a German population page as a fallback.
        index.source = buildPage(template, renderHead(pages[0].title.de, 'de', pagePaths(pages[0])), 'de');
      },
    },
  };
}
