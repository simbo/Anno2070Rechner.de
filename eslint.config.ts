import { configs, globals } from '@simbo/eslint-config';
import pluginVue from 'eslint-plugin-vue';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

/**
 * Applies the shared rules with type information from the matching TypeScript project.
 * Root tooling runs in Node; app and test files use the browser and test projects.
 * Component files need the Vue.js parser around the TypeScript parser.
 * The old PHP app and its JavaScript stay unlinted until they are removed.
 */
export default defineConfig([
  globalIgnores(['**/dist/', '**/coverage/', 'js/', 'css/', 'fonts/', 'inc/', 'tpl/', 'conf/', 'i18n/', 'img/']),
  {
    files: ['*.ts'],
    extends: [configs.node.recommended],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        project: './tsconfig.node.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/**/*.{ts,vue}'],
    extends: [configs.browser.recommended],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: {
        project: ['./tsconfig.browser.json', './tsconfig.tests.json'],
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tseslint.parser },
    },
  },
]);
