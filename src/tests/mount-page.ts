import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createMemoryHistory, type Router } from 'vue-router';

import App from '../app.vue';
import { createAppRouter } from '../router';

/**
 * Mounts the whole app at a path, with the catalog loaded as in the browser.
 *
 * @param path - The URL path with query.
 * @returns The mounted app and its router.
 */
export async function mountPage(path: string): Promise<{ wrapper: VueWrapper; router: Router }> {
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  await router.isReady();
  const wrapper = mount(App, { global: { plugins: [createPinia(), router] }, attachTo: globalThis.document.body });
  await flushPromises();
  return { wrapper, router };
}
