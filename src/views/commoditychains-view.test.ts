import { flushPromises, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mountPage } from '../tests/mount-page';
import { required } from '../tests/required';

const { document } = globalThis;

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

/**
 * Types a productivity into a building of the chain.
 *
 * @param wrapper - The page.
 * @param guid - The building.
 * @param text - The productivity.
 */
async function typeProductivity(wrapper: VueWrapper, guid: string, text: string): Promise<void> {
  const input = wrapper.find(`#commodity-chain-container .production[data-guid="${guid}"] .productivity input`);
  await input.trigger('focus');
  await input.setValue(text);
  await input.trigger('change');
  await flushPromises();
}

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
    await input.trigger('change');
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

describe('commodity chains in the URL', () => {
  it('keep what was set in the chain, ready to be reloaded or shared', async () => {
    const { wrapper, router } = await mountPage('/commoditychains?pb_guid=10186');
    await flushPromises();
    vi.useFakeTimers();
    const guid = required(
      required(wrapper.findAll('#commodity-chain-container .production').at(1)).attributes('data-guid'),
    );
    await typeProductivity(wrapper, guid, '150');
    expect(router.currentRoute.value.query.prod).toBeUndefined();
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
    await flushPromises();
    expect(router.currentRoute.value.query.prod).toBe(`${guid}:150`);
    const url = router.currentRoute.value.fullPath;
    wrapper.unmount();
    const reloaded = await mountPage(url);
    await flushPromises();
    const input = reloaded.wrapper.find(`.production[data-guid="${guid}"] .productivity input`);
    expect(input.element).toHaveProperty('value', '150');
  });

  it('keep the target when the top building changes its productivity', async () => {
    const { wrapper, router } = await mountPage('/commoditychains?pb_guid=10045&count=2');
    await flushPromises();
    vi.useFakeTimers();
    await typeProductivity(wrapper, '10045', '200');
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
    await flushPromises();
    expect(router.currentRoute.value.query).toMatchObject({ prod: '10045:200', target_tpm: '4' });
    expect(wrapper.find('input[name="tpm_needed"]').element).toHaveProperty('value', '');
  });

  it('show a shared chain with its productivities and alternatives', async () => {
    const plain = await mountPage('/commoditychains?pb_guid=10025&count=2');
    await flushPromises();
    const plainText = plain.wrapper.find('#commodity-chain-container').text();
    plain.wrapper.unmount();
    const { wrapper, router } = await mountPage('/commoditychains?pb_guid=10025&count=2&prod=10024:200&alt=10098');
    await flushPromises();
    expect(wrapper.find('#commodity-chain-container').text()).not.toBe(plainText);
    expect(router.currentRoute.value.query).toMatchObject({ prod: '10024:200', alt: '10098' });
  });

  it('ignore invalid parameters', async () => {
    const { router } = await mountPage('/commoditychains?pb_guid=10025&prod=1:200,10024:x&alt=1');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ pb_guid: '10025' });
  });

  it('keep the old parameters unchanged', async () => {
    const { wrapper, router } = await mountPage('/commoditychains?pb_guid=10045&count=3&target_tpm=8');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ pb_guid: '10045', count: '3', target_tpm: '8' });
    expect(wrapper.find('input[name="tpm_needed"]').element).toHaveProperty('value', '8');
  });

  it('start over when the menu item is clicked again', async () => {
    const { wrapper, router } = await mountPage('/commoditychains?pb_guid=10045&count=3');
    await flushPromises();
    await wrapper.find('#menu li:nth-child(2) a').trigger('click');
    await flushPromises();
    expect(wrapper.find('input[name="count"]').element).toHaveProperty('value', '1');
    expect(router.currentRoute.value.query.count).toBeUndefined();
  });
});
