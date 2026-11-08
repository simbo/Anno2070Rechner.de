import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';

import htmlMinifierPlugin from '@simbo/vite-plugin-html-minifier';
import legacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import { createLogger, defineConfig, type Connect, type Plugin } from 'vite';

import { routePagesPlugin } from './route-pages.plugin.ts';

const imageRoot = resolve(import.meta.dirname, 'img');

const imageTypes: Record<string, string> = {
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
};

/**
 * Serves `/img/*` from the unpacked private image archive during development and
 * preview. Builds never contain the images; on the server they are stored separately.
 *
 * @returns The Vite plugin.
 */
function archiveImagesPlugin(): Plugin {
  const middleware: Connect.NextHandleFunction = (request, response, next) => {
    const path = decodeURIComponent((request.url ?? '').split('?', 1)[0] ?? '');
    if (!path.startsWith('/img/')) {
      next();
      return;
    }
    const file = resolve(imageRoot, path.slice('/img/'.length));
    if (!file.startsWith(imageRoot + sep) || !existsSync(file) || !statSync(file).isFile()) {
      response.statusCode = 404;
      response.end();
      return;
    }
    response.setHeader('Content-Type', imageTypes[extname(file)] ?? 'application/octet-stream');
    createReadStream(file).pipe(response);
  };
  return {
    name: 'archive-images',
    // The images are not part of the build; keep their URLs as they are.
    resolveId: id => (id.startsWith('/img/') ? { id, external: true } : undefined),
    configureServer: server => void server.middlewares.use(middleware),
    configurePreviewServer: server => void server.middlewares.use(middleware),
  };
}

// The archive images are resolved at runtime by design; do not warn about each of them.
const logger = createLogger();
const isImageWarning = (message: string): boolean => /^\/img\/.* didn't resolve at build time/.test(message);
const warn = logger.warn.bind(logger);
const warnOnce = logger.warnOnce.bind(logger);
logger.warn = (message, options) => {
  if (!isImageWarning(message)) warn(message, options);
};
logger.warnOnce = (message, options) => {
  if (!isImageWarning(message)) warnOnce(message, options);
};

export default defineConfig({
  customLogger: logger,
  root: 'src',
  base: '/',
  publicDir: 'static',
  plugins: [
    vue({ template: { transformAssetUrls: { includeAbsolute: false } } }),
    // Old browsers load a separate bundle; its targets are in .browserslistrc. The modern bundle
    // reaches back further than some libraries, which only need these few additions.
    legacy({
      modernPolyfills: ['es.array.flat-map', 'es.global-this', 'es.object.from-entries', 'es.object.has-own'],
    }),
    archiveImagesPlugin(),
    htmlMinifierPlugin(),
    routePagesPlugin(),
  ],
  build: {
    // The same browsers as in .browserslistrc, which only the legacy plugin reads.
    cssTarget: ['chrome49', 'edge12', 'firefox42', 'opera36', 'safari10'],
    outDir: '../dist',
    emptyOutDir: true,
  },
});
