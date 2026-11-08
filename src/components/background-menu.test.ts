import { flushPromises, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { dailyBackground } from '../models/background';
import { backgroundStorageKey, parseBackgroundChoice } from '../stores/background';
import { mountPage } from '../tests/mount-page';
import { required } from '../tests/required';

const { document, localStorage } = globalThis;

/**
 * How long a test waits for a preview to start, in milliseconds.
 */
const PREVIEW_WAIT = 200;

/**
 * Images that were requested. A test decides when they finish loading.
 */
let requested: { src: string; load: () => void }[] = [];

/**
 * A browser image that only reports having loaded when a test says so.
 */
class FakeImage {
  private listener: (() => void) | undefined;

  /**
   * Records the request.
   *
   * @param value - The address of the image.
   */
  public set src(value: string) {
    requested.push({ src: value, load: () => this.listener?.() });
  }

  /**
   * Remembers the load listener.
   *
   * @param _type - The event name.
   * @param listener - The listener.
   */
  public addEventListener(_type: string, listener: () => void): void {
    this.listener = listener;
  }
}

const trigger = (wrapper: VueWrapper): ReturnType<VueWrapper['find']> => wrapper.find('.user-menu li.background a');
const entries = (wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> => wrapper.findAll('#background-menu li');
const entry = (wrapper: VueWrapper, index: number): ReturnType<VueWrapper['find']> =>
  required(entries(wrapper).at(index));
const shownImage = (): string =>
  required([...document.body.classList].find(name => name.startsWith('bg-'))).replace('bg-', '');

/**
 * Lets a pointed-at entry start loading its image and finishes loading it.
 */
async function finishPreview(): Promise<void> {
  await vi.advanceTimersByTimeAsync(PREVIEW_WAIT);
  required(requested.at(-1)).load();
  await flushPromises();
}

describe('background menu', () => {
  beforeEach(() => {
    localStorage.clear();
    requested = [];
    vi.stubGlobal('Image', FakeImage);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it('shows the image of the day by default', async () => {
    await mountPage('/info');
    expect(shownImage()).toBe(dailyBackground(new Date()));
    expect(localStorage.getItem(backgroundStorageKey)).toBeNull();
  });

  it('shows a saved image and ignores invalid stored values', async () => {
    localStorage.setItem(backgroundStorageKey, 'tycoon2');
    await mountPage('/info');
    expect(shownImage()).toBe('tycoon2');
    expect(parseBackgroundChoice('nonsense')).toBe('random');
    expect(parseBackgroundChoice(null)).toBe('random');
  });

  it('lists the choices in the language of the page and marks the saved one', async () => {
    const { wrapper } = await mountPage('/info/en');
    expect(trigger(wrapper).attributes('title')).toBe('Background');
    expect(wrapper.find('#background-menu').exists()).toBe(false);
    await trigger(wrapper).trigger('click');
    expect(entries(wrapper).map(item => item.text())).toEqual([
      'Random (changes daily)',
      'Ecos 1',
      'Ecos 2',
      'Ecos 3',
      'Ecos 4',
      'Ecos 5',
      'Tycoons 1',
      'Tycoons 2',
    ]);
    expect(entry(wrapper, 0).classes()).toContain('ui-selectmenu-item-selected');
  });

  it('previews a pointed-at entry only after its image has loaded', async () => {
    localStorage.setItem(backgroundStorageKey, 'eco1');
    const { wrapper } = await mountPage('/info');
    await trigger(wrapper).trigger('click');
    await entry(wrapper, 3).trigger('mouseenter');
    expect(entry(wrapper, 3).classes()).toContain('ui-state-hover');
    await vi.advanceTimersByTimeAsync(PREVIEW_WAIT);
    expect(required(requested.at(-1)).src).toBe('/img/bg-body-eco3.jpg');
    expect(shownImage()).toBe('eco1');
    required(requested.at(-1)).load();
    await flushPromises();
    expect(shownImage()).toBe('eco3');
    expect(localStorage.getItem(backgroundStorageKey)).toBe('eco1');
  });

  it('does not load images for entries that are only passed over', async () => {
    const { wrapper } = await mountPage('/info');
    await trigger(wrapper).trigger('click');
    for (const item of entries(wrapper)) await item.trigger('mouseenter');
    await vi.advanceTimersByTimeAsync(PREVIEW_WAIT);
    expect(requested.map(image => image.src)).toEqual(['/img/bg-body-tycoon2.jpg']);
  });

  it('ignores an image that finishes loading after the pointer moved on', async () => {
    localStorage.setItem(backgroundStorageKey, 'eco1');
    const { wrapper } = await mountPage('/info');
    await trigger(wrapper).trigger('click');
    await entry(wrapper, 3).trigger('mouseenter');
    await vi.advanceTimersByTimeAsync(PREVIEW_WAIT);
    const image = required(requested.at(-1));
    await wrapper.find('#background-menu ul').trigger('mouseleave');
    image.load();
    await flushPromises();
    expect(shownImage()).toBe('eco1');
  });

  it('returns to the saved choice when the pointer leaves the list', async () => {
    localStorage.setItem(backgroundStorageKey, 'eco1');
    const { wrapper } = await mountPage('/info');
    await trigger(wrapper).trigger('click');
    await entry(wrapper, 3).trigger('mouseenter');
    await finishPreview();
    await wrapper.find('#background-menu ul').trigger('mouseleave');
    expect(shownImage()).toBe('eco1');
    expect(wrapper.find('#background-menu').exists()).toBe(true);
  });

  it('saves a clicked entry and closes the list', async () => {
    const { wrapper } = await mountPage('/info');
    await trigger(wrapper).trigger('click');
    await entry(wrapper, 6).find('a').trigger('click');
    await flushPromises();
    expect(shownImage()).toBe('tycoon1');
    expect(localStorage.getItem(backgroundStorageKey)).toBe('tycoon1');
    expect(wrapper.find('#background-menu').exists()).toBe(false);
  });

  it('goes back to the image of the day when choosing random', async () => {
    localStorage.setItem(backgroundStorageKey, 'tycoon1');
    const { wrapper } = await mountPage('/info');
    await trigger(wrapper).trigger('click');
    await entry(wrapper, 0).find('a').trigger('click');
    await flushPromises();
    expect(shownImage()).toBe(dailyBackground(new Date()));
    expect(localStorage.getItem(backgroundStorageKey)).toBe('random');
  });

  it('previews with the arrow keys, starting at the saved entry, and saves with Enter', async () => {
    localStorage.setItem(backgroundStorageKey, 'eco1');
    const { wrapper } = await mountPage('/info');
    await trigger(wrapper).trigger('click');
    await trigger(wrapper).trigger('keydown', { key: 'ArrowDown' });
    expect(entry(wrapper, 2).classes()).toContain('ui-state-hover');
    await finishPreview();
    expect(shownImage()).toBe('eco2');
    await trigger(wrapper).trigger('keydown', { key: 'ArrowUp' });
    await trigger(wrapper).trigger('keydown', { key: 'ArrowUp' });
    await trigger(wrapper).trigger('keydown', { key: 'ArrowUp' });
    expect(entry(wrapper, 0).classes()).toContain('ui-state-hover');
    await trigger(wrapper).trigger('keydown', { key: 'ArrowDown' });
    await trigger(wrapper).trigger('keydown', { key: 'ArrowDown' });
    await trigger(wrapper).trigger('keydown', { key: 'Enter' });
    await flushPromises();
    expect(localStorage.getItem(backgroundStorageKey)).toBe('eco2');
    expect(wrapper.find('#background-menu').exists()).toBe(false);
  });

  it('restores the saved choice with Escape and with a click elsewhere', async () => {
    localStorage.setItem(backgroundStorageKey, 'eco1');
    const { wrapper } = await mountPage('/info');
    for (const dismiss of [
      async () => trigger(wrapper).trigger('keydown', { key: 'Escape' }),
      async () => wrapper.find('h2').trigger('click'),
    ]) {
      await trigger(wrapper).trigger('click');
      await entry(wrapper, 3).trigger('mouseenter');
      await finishPreview();
      expect(shownImage()).toBe('eco3');
      await dismiss();
      await flushPromises();
      expect(shownImage()).toBe('eco1');
      expect(wrapper.find('#background-menu').exists()).toBe(false);
      expect(localStorage.getItem(backgroundStorageKey)).toBe('eco1');
    }
  });

  it('keeps the image when navigating to another page', async () => {
    localStorage.setItem(backgroundStorageKey, 'eco4');
    const { wrapper, router } = await mountPage('/info');
    await router.push('/database');
    await flushPromises();
    expect(document.body.classList.contains('database')).toBe(true);
    expect(shownImage()).toBe('eco4');
    expect(wrapper.find('.user-menu').exists()).toBe(true);
  });
});
