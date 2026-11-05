import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mountPage } from '../tests/mount-page';
import { required } from '../tests/required';

const { document } = globalThis;

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('commodity chain page', () => {
  it('shows the chain of the building in the URL with count and target', async () => {
    const { wrapper } = await mountPage('/commoditychains?pb_guid=10156&count=3&target_tpm=4,5');
    expect((wrapper.find('select[name=pb_guid]').element as HTMLSelectElement).value).toBe('10156');
    expect((wrapper.find('input[name=count]').element as HTMLInputElement).value).toBe('3');
    expect((wrapper.find('input[name=tpm_needed]').element as HTMLInputElement).value).toBe('4.5');
    expect(wrapper.find('.commodity-chain dl.chain dt .target').text()).toBe('4.5');
    expect(wrapper.find('.commodity-chain .summary').exists()).toBe(true);
  });

  it('lists buildings with raw materials first, then the others after a dash', async () => {
    const { wrapper } = await mountPage('/commoditychains');
    const options = wrapper.findAll('select[name=pb_guid] option').map(option => option.text());
    const dash = options.indexOf('—');
    expect(options[0]).toBe('Atomkraftwerk');
    expect(options[dash + 1]).toBe('Aquafarm');
    expect(wrapper.find('.commodity-chain .production').attributes('data-guid')).toBe('10050');
  });

  it('calculates a new chain on submit and keeps the URL shareable', async () => {
    const { wrapper, router } = await mountPage('/commoditychains/en?pb_guid=10045');
    await wrapper.find('input[name=count]').setValue('4');
    await wrapper.find('form').trigger('submit');
    await flushPromises();
    expect(wrapper.find('.production .count').text()).toBe('×4');
    expect(router.currentRoute.value.query).toEqual({ pb_guid: '10045', count: '4' });
  });

  it('switches to an alternative building by clicking it', async () => {
    const { wrapper } = await mountPage('/commoditychains?pb_guid=10186');
    const alternative = wrapper.find('dd.alt .production');
    const guid = required(alternative.attributes('data-guid'));
    await alternative.trigger('click');
    const group = required(wrapper.findAll('dl.chain').find(dl => dl.find(`[data-guid="${guid}"]`).exists()));
    expect(group.find('dd:not(.alt) .production').attributes('data-guid')).toBe(guid);
  });

  it('recalculates the chain after changing a productivity', async () => {
    const { wrapper } = await mountPage('/commoditychains?pb_guid=10156');
    const production = wrapper.find('.commodity-chain > dl.chain .production');
    const input = production.find('.productivity input');
    await input.trigger('focus');
    expect(production.classes()).toContain('active');
    await input.trigger('keydown');
    await input.setValue('50');
    await input.trigger('keyup');
    expect(production.find('.count').text()).toBe('×2');
    expect(production.find('.efficiency em').exists()).toBe(false);
    globalThis.dispatchEvent(new MouseEvent('click'));
    await flushPromises();
    const root = wrapper.find('.commodity-chain > dl.chain .production');
    expect(root.find('.count').text()).toBe('×2');
    expect(root.find('.productivity input').element).toHaveProperty('value', '50');
  });

  it('chooses a building from the search', async () => {
    vi.useFakeTimers();
    const { wrapper } = await mountPage('/commoditychains');
    const search = wrapper.find('input[name=search]');
    await search.setValue('fisch');
    await search.trigger('keydown', { key: 'h' });
    vi.advanceTimersByTime(300);
    await flushPromises();
    await search.trigger('keydown', { key: 'ArrowDown' });
    await search.trigger('keydown', { key: 'Enter' });
    await flushPromises();
    expect((wrapper.find('select[name=pb_guid]').element as HTMLSelectElement).value).toBe('10045');
    expect(wrapper.find('.commodity-chain .production').attributes('data-guid')).toBe('10045');
  });
});
