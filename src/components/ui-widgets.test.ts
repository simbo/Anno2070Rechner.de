import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { required } from '../tests/required';

import UiAutocomplete from './ui-autocomplete.vue';
import UiSelectMenu from './ui-select-menu.vue';
import UiSlider from './ui-slider.vue';

const { document } = globalThis;

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

/**
 * The last value a component reported through `v-model`.
 *
 * @param wrapper - The mounted component.
 * @returns The value, or undefined before any update.
 */
function lastModel(wrapper: VueWrapper): unknown {
  return wrapper.emitted('update:modelValue')?.at(-1)?.[0];
}

/**
 * The emitted events with the given names, each with its first argument.
 *
 * @param wrapper - The mounted component.
 * @param names - The event names to include.
 * @returns The events as text.
 */
function eventLog(wrapper: VueWrapper, names: string[]): string[] {
  return Object.entries(wrapper.emitted())
    .filter(([name]) => names.includes(name))
    .flatMap(([name, calls]) =>
      calls.map(args => {
        const values = args as unknown[];
        return values.length > 0 ? `${name} ${String(values[0])}` : name;
      }),
    );
}

const mountSlider = (value: number): VueWrapper =>
  mount(UiSlider, { props: { modelValue: value, min: 1, max: 4 }, attachTo: document.body });

describe('UiSlider', () => {
  it('renders the jQuery UI markup at the value position', () => {
    const wrapper = mountSlider(2);
    expect(wrapper.find('.ui-slider-range').attributes('style')).toContain('width: 33.33');
    expect(wrapper.find('a.ui-slider-handle').attributes('href')).toBe('#');
  });

  it('moves with the keyboard and reports start, slide and stop', async () => {
    const wrapper = mountSlider(2);
    const handle = wrapper.find('a.ui-slider-handle');
    await handle.trigger('keydown', { key: 'ArrowRight' });
    await handle.trigger('keydown', { key: 'ArrowRight' });
    await handle.trigger('keydown', { key: 'ArrowRight' });
    await handle.trigger('keyup', { key: 'ArrowRight' });
    expect(lastModel(wrapper)).toBe(4);
    expect(eventLog(wrapper, ['start', 'slide', 'stop'])).toEqual(['start', 'slide 3', 'slide 4', 'stop']);
    await handle.trigger('keydown', { key: 'Home' });
    expect(lastModel(wrapper)).toBe(1);
    await handle.trigger('keydown', { key: 'PageUp' });
    expect(lastModel(wrapper)).toBe(2);
    await handle.trigger('keydown', { key: 'End' });
    await handle.trigger('keydown', { key: 'ArrowLeft' });
    expect(lastModel(wrapper)).toBe(3);
    const updates = wrapper.emitted('update:modelValue')?.length;
    await handle.trigger('keydown', { key: 'a' });
    expect(wrapper.emitted('update:modelValue')?.length).toBe(updates);
  });

  it('jumps to a clicked position and follows the mouse', async () => {
    const wrapper = mountSlider(1);
    const track = wrapper.find('.ui-slider').element as HTMLElement;
    Object.defineProperty(track, 'offsetWidth', { value: 300 });
    track.getBoundingClientRect = () => DOMRect.fromRect({ x: 0, y: 0, width: 300, height: 4 });
    await wrapper.find('.ui-slider').trigger('mousedown', { button: 0, clientX: 210 });
    expect(lastModel(wrapper)).toBe(3);
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300 }));
    expect(lastModel(wrapper)).toBe(4);
    document.dispatchEvent(new MouseEvent('mouseup'));
    expect(wrapper.emitted('stop')).toHaveLength(1);
  });
});

const selectOptions = [
  { value: '', label: '—' },
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'b2', label: 'Bravo' },
];

const mountSelect = (): VueWrapper =>
  mount(UiSelectMenu, { props: { modelValue: '', options: selectOptions, name: 'test' }, attachTo: document.body });

const selectMenu = (): Element => required(document.querySelector('.ui-selectmenu-menu'));

describe('UiSelectMenu', () => {
  it('renders the plugin markup with the hidden native select', async () => {
    const wrapper = mountSelect();
    await flushPromises();
    expect(wrapper.find('select').attributes('style')).toContain('display: none');
    expect(wrapper.find('a.ui-selectmenu .ui-selectmenu-status').text()).toBe('—');
    expect(selectMenu().querySelectorAll('li')).toHaveLength(4);
  });

  it('opens on mouse down and chooses an entry on release', async () => {
    vi.useFakeTimers();
    const wrapper = mountSelect();
    await wrapper.find('a.ui-selectmenu').trigger('mousedown', { button: 0 });
    await flushPromises();
    expect(selectMenu().classList).toContain('ui-selectmenu-open');
    const item = required(selectMenu().querySelectorAll('li')[2]);
    item.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(wrapper.emitted('select')).toBeUndefined();
    vi.advanceTimersByTime(300);
    item.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    await flushPromises();
    expect(lastModel(wrapper)).toBe('b');
    expect(wrapper.emitted('select')).toEqual([['b']]);
    expect(selectMenu().classList).not.toContain('ui-selectmenu-open');
  });

  it('moves the selection with the arrow keys and type-ahead', async () => {
    const wrapper = mountSelect();
    const button = wrapper.find('a.ui-selectmenu');
    await button.trigger('keydown', { key: 'ArrowDown' });
    expect(lastModel(wrapper)).toBe('a');
    await button.trigger('keydown', { key: 'b' });
    expect(lastModel(wrapper)).toBe('b');
    await button.trigger('keydown', { key: 'b' });
    expect(lastModel(wrapper)).toBe('b2');
    await button.trigger('keydown', { key: 'Home' });
    expect(lastModel(wrapper)).toBe('');
    expect(wrapper.emitted('select')).toEqual([['a'], ['b'], ['b2']]);
  });

  it('navigates the open list with the keyboard and closes on Escape', async () => {
    const wrapper = mountSelect();
    const button = wrapper.find('a.ui-selectmenu');
    await button.trigger('keydown', { key: ' ' });
    await flushPromises();
    const list = required(selectMenu().querySelector('ul'));
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await flushPromises();
    expect(lastModel(wrapper)).toBe('b2');
    await button.trigger('keydown', { key: ' ' });
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await flushPromises();
    expect(selectMenu().classList).not.toContain('ui-selectmenu-open');
    expect(wrapper.emitted('select')).toHaveLength(1);
  });
});

const suggestionNames = ['Fisch', 'Fischerei', 'Fleisch'];

const suggestions = (term: string): { label: string; value: string }[] =>
  suggestionNames
    .filter(name => name.toLowerCase().startsWith(term.toLowerCase()))
    .map(name => ({ label: name, value: name }));

const mountInput = (): VueWrapper =>
  mount(UiAutocomplete, { props: { modelValue: '', source: suggestions, name: 'search' }, attachTo: document.body });

const suggestionMenu = (): HTMLElement => required(document.querySelector<HTMLElement>('.ui-autocomplete'));

/**
 * Types a text and waits for the suggestion delay.
 *
 * @param wrapper - The mounted input.
 * @param text - The text to type.
 */
async function type(wrapper: VueWrapper, text: string): Promise<void> {
  const input = wrapper.find('input');
  await input.setValue(text);
  await input.trigger('keydown', { key: text.at(-1) });
  vi.advanceTimersByTime(300);
  await flushPromises();
}

describe('UiAutocomplete', () => {
  it('shows suggestions after a short delay', async () => {
    vi.useFakeTimers();
    const wrapper = mountInput();
    const input = wrapper.find('input');
    expect(input.classes()).toContain('ui-autocomplete-input');
    await input.setValue('fi');
    await input.trigger('keydown', { key: 'i' });
    expect(suggestionMenu().style.display).toBe('none');
    vi.advanceTimersByTime(300);
    await flushPromises();
    expect(suggestionMenu().style.display).toBe('block');
    expect([...suggestionMenu().querySelectorAll('li')].map(item => item.textContent)).toEqual(['Fisch', 'Fischerei']);
  });

  it('fills the input while moving and chooses with Enter', async () => {
    vi.useFakeTimers();
    const wrapper = mountInput();
    await type(wrapper, 'fi');
    const input = wrapper.find('input');
    await input.trigger('keydown', { key: 'ArrowDown' });
    await input.trigger('keydown', { key: 'ArrowDown' });
    expect(lastModel(wrapper)).toBe('Fischerei');
    expect(suggestionMenu().querySelector('#ui-active-menuitem')?.textContent).toBe('Fischerei');
    await input.trigger('keydown', { key: 'ArrowDown' });
    expect(lastModel(wrapper)).toBe('fi');
    await input.trigger('keydown', { key: 'ArrowUp' });
    await input.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('select')).toEqual([[{ label: 'Fischerei', value: 'Fischerei' }]]);
    expect(suggestionMenu().style.display).toBe('none');
  });

  it('restores the typed text on Escape and shows nothing without matches', async () => {
    vi.useFakeTimers();
    const wrapper = mountInput();
    await type(wrapper, 'f');
    const input = wrapper.find('input');
    await input.trigger('keydown', { key: 'ArrowDown' });
    await input.trigger('keydown', { key: 'Escape' });
    expect(lastModel(wrapper)).toBe('f');
    expect(suggestionMenu().style.display).toBe('none');
    await type(wrapper, 'x');
    expect(suggestionMenu().style.display).toBe('none');
  });
});
