import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

/**
 * Runs source-adjacent tests from the repository root, while Vite's app root remains
 * src/. Component tests use jsdom. Coverage includes untested files so the report can
 * reveal missing scenarios.
 */
export default mergeConfig(
  viteConfig({ command: 'serve', mode: 'test' }),
  defineConfig({
    test: {
      environment: 'jsdom',
      root: import.meta.dirname,
      clearMocks: true,
      exclude: [...configDefaults.exclude],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,vue}', '*.plugin.ts'],
        exclude: ['**/*.d.ts', '**/*.test.ts', 'src/tests/**'],
        reporter: ['text', 'html', 'json-summary'],
      },
    },
  }),
);
