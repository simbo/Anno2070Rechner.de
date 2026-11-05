/// <reference types="vite/client" />

/**
 * Lets TypeScript tooling resolve .vue imports from router and startup files.
 * The component compiler checks the actual component scripts and templates separately.
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
