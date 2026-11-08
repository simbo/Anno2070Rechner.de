import { configs, globals } from '@simbo/eslint-config';
import pluginVue from 'eslint-plugin-vue';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

/**
 * Applies the shared rules with type information from the matching TypeScript project.
 * Root tooling runs in Node; app and test files use the browser and test projects.
 * Component files need the Vue.js parser around the TypeScript parser.
 */
export default defineConfig([
  globalIgnores(['**/dist/', '**/coverage/', 'img/']),
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
    // The app supports old browsers, see docs/rebuild-plan.md#browser-support, and its code stays
    // at ES2018. These rules ask for newer APIs, or for APIs the modern bundle would have to add.
    rules: {
      'unicorn/no-array-sort': 'off',
      'unicorn/prefer-array-flat': 'off',
      'unicorn/prefer-array-flat-map': 'off',
      'unicorn/prefer-at': 'off',
      'unicorn/prefer-object-from-entries': 'off',
      'unicorn/prefer-string-replace-all': 'off',
      'unicorn/prefer-top-level-await': 'off',
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
