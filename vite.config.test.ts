// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { ConfigEnv, IndexHtmlTransformContext, Plugin } from 'vite';
import { describe, expect, it } from 'vitest';

import config from './vite.config.ts';

const indexFile = resolve(import.meta.dirname, 'src/index.html');

/**
 * Renders `src/index.html` through the Nunjucks plugin of the configuration for a command.
 *
 * @param command - The Vite command.
 * @returns The rendered HTML.
 */
async function renderIndex(command: ConfigEnv['command']): Promise<string> {
  const plugins = (config({ command, mode: 'test' }).plugins ?? []).flat() as Plugin[];
  const nunjucks = plugins.find(plugin => plugin.name === 'vite-plugin-nunjucks');
  const hook = nunjucks?.transformIndexHtml;
  if (!hook || typeof hook === 'function') throw new Error('Expected the Nunjucks plugin with a hook object');
  const context = { filename: indexFile, path: '/index.html' } as IndexHtmlTransformContext;
  const result = await hook.handler.call(undefined as never, readFileSync(indexFile, 'utf8'), context);
  if (typeof result !== 'string') throw new Error('Expected HTML');
  return result;
}

describe('visitor statistics', () => {
  it('are part of production builds', async () => {
    expect(await renderIndex('build')).toContain(
      '<script defer src="https://trk.srvkist.net/trk.js" data-website-id="4c2e9006-f449-4c9f-aec7-897bcceb1168"></script>',
    );
  });

  it('stay out of development', async () => {
    expect(await renderIndex('serve')).not.toContain('trk.srvkist.net');
  });
});
