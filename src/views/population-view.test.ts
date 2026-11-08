import { flushPromises, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { mountPage } from '../tests/mount-page';
import { required } from '../tests/required';

const { document, localStorage } = globalThis;

const value = (wrapper: VueWrapper, name: string): string =>
  (wrapper.find(`input[name=${name}]`).element as HTMLInputElement).value;

/**
 * Types into a number input like a visitor: key down, new text, key up.
 *
 * @param wrapper - The mounted page.
 * @param name - The input name.
 * @param text - The new text.
 */
async function enter(wrapper: VueWrapper, name: string, text: string): Promise<void> {
  const input = wrapper.find(`input[name=${name}]`);
  await input.trigger('keydown');
  await input.setValue(text);
  await input.trigger('keyup');
  await flushPromises();
}

const demandTexts = (wrapper: VueWrapper): string[] =>
  wrapper.findAll('#demands-fieldset li .count').map(item => item.text());

describe('population calculator', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('distributes houses, calculates residents, demands and buildings like the live site', async () => {
    const { wrapper } = await mountPage('/population');
    await enter(wrapper, 'ecos0r', '250');
    await enter(wrapper, 'tycoons0r', '180');
    await enter(wrapper, 'techs0r', '90');
    expect(['ecos1r', 'ecos2r', 'ecos3r', 'ecos4r'].map(name => value(wrapper, name))).toEqual([
      '50',
      '80',
      '72',
      '48',
    ]);
    expect(['ecos0i', 'tycoons0i', 'techs0i'].map(name => value(wrapper, name))).toEqual(['5320', '3818', '1800']);
    expect(demandTexts(wrapper).slice(0, 5)).toEqual(['40,4', '15,6', '17,5', '11,8', '6']);
    const first = wrapper.find('#production-fieldset li');
    expect(first.find('.count span').text()).toBe('21');
    expect(first.find('.efficiency').classes()).toEqual(['efficiency', 'green']);
    expect(first.find('.efficiency').text()).toBe('96%');
  });

  it('keeps only digits in number inputs', async () => {
    const { wrapper } = await mountPage('/population');
    await enter(wrapper, 'ecos1r', '0a12');
    expect(value(wrapper, 'ecos1r')).toBe('12');
    expect(value(wrapper, 'ecos0r')).toBe('12');
    expect(value(wrapper, 'ecos1i')).toBe('96');
  });

  it('applies information channels', async () => {
    const { wrapper } = await mountPage('/population/en');
    await enter(wrapper, 'ecos1r', '10');
    await wrapper.find('#ecos_info_1').trigger('click');
    expect(value(wrapper, 'ecos1i')).toBe('80');
    await wrapper.find('#ecos_info_1').trigger('click');
    await enter(wrapper, 'ecos4r', '10');
    await wrapper.find('#ecos_info_1').trigger('click');
    expect(value(wrapper, 'ecos4i')).toBe('440');
    expect(wrapper.find('#ecos_info_1').classes()).toContain('active');
    await wrapper.find('#ecos_info_2').trigger('click');
    expect(wrapper.find('#ecos_info_1').classes()).not.toContain('active');
    expect(demandTexts(wrapper)[0]).toMatch(/^\d+(\.\d)?$/);
  });

  it('resets inputs but keeps the hidden upgrade levels, as the old reset did', async () => {
    const { wrapper } = await mountPage('/population');
    await enter(wrapper, 'ecos0r', '137');
    await wrapper.find('#residences-fieldset dl.ecos .ui-slider-handle').trigger('keydown', { key: 'ArrowLeft' });
    await wrapper.find('#residences-fieldset dl.ecos .ui-slider-handle').trigger('keyup', { key: 'ArrowLeft' });
    expect(value(wrapper, 'ecos_max_upgrade')).toBe('3');
    await wrapper.find('#residences-fieldset input.reset').trigger('click');
    await flushPromises();
    expect(value(wrapper, 'ecos0r')).toBe('0');
    expect(value(wrapper, 'ecos0i')).toBe('0');
    expect(value(wrapper, 'ecos_max_upgrade')).toBe('3');
    expect(wrapper.find('#residences-fieldset dl.ecos .ui-slider-handle').attributes('style')).toContain('left: 100%');
  });

  it('shows the commodity chain of a selected building and its target select', async () => {
    const { wrapper } = await mountPage('/population');
    await enter(wrapper, 'ecos0r', '200');
    const items = wrapper.findAll('#production-fieldset li:not(.no-demand)');
    await items[3].trigger('click');
    await flushPromises();
    expect(items[3].classes()).toContain('selected');
    expect(wrapper.find('#commodity-chain-container .commodity-chain').exists()).toBe(true);
    expect(wrapper.find('#commodity-chain-target').isVisible()).toBe(true);
    await items[3].trigger('click');
    await flushPromises();
    expect(items[3].classes()).not.toContain('selected');
  });

  it('toggles boxes and remembers inputs in the browser', async () => {
    const { wrapper } = await mountPage('/population');
    expect(wrapper.find('#demands-fieldset').isVisible()).toBe(false);
    await wrapper.find('#display-options .show_demands').trigger('click');
    expect(wrapper.find('#display-options .show_demands').classes()).toContain('active');
    await enter(wrapper, 'techs0r', '5');
    await flushPromises();
    const stored = JSON.parse(required(localStorage.getItem('anno2070rechner:population'))) as {
      show: { demands: boolean };
      residences: { techs: string[] };
    };
    expect(stored.show.demands).toBe(true);
    expect(stored.residences.techs[0]).toBe('5');
  });

  it('recalculates buildings from a typed productivity and reloads the chain after leaving the input', async () => {
    const { wrapper } = await mountPage('/population');
    await enter(wrapper, 'ecos0r', '300');
    const fishery = wrapper.find('#production-fieldset li[data-guid="10045"]');
    const before = Number(fishery.find('.count span').text());
    const input = fishery.find('.productivity input');
    await input.trigger('focusin');
    expect(fishery.classes()).toEqual(expect.arrayContaining(['active', 'selected']));
    const chain = (): string => wrapper.find('#commodity-chain-container .production .count').text();
    const chainBefore = chain();
    await input.trigger('keydown');
    await input.setValue('200');
    await input.trigger('keyup');
    expect(Number(fishery.find('.count span').text())).toBe(Math.ceil(before / 2));
    // Like the old site, the chain only follows after the input loses focus.
    expect(chain()).toBe(chainBefore);
    await input.trigger('blur');
    await flushPromises();
    expect(chain()).not.toBe(chainBefore);
  });

  it('clamps productivities to 1 to 999 percent', async () => {
    const { wrapper } = await mountPage('/population');
    await enter(wrapper, 'ecos0r', '100');
    const input = wrapper.find('#production-fieldset li[data-guid="10045"] .productivity input');
    await input.setValue('5000');
    await input.trigger('change');
    expect((input.element as HTMLInputElement).value).toBe('999');
    await input.setValue('0');
    await input.trigger('change');
    expect((input.element as HTMLInputElement).value).toBe('1');
  });

  it('hides the chain together with the production buildings and after an outside click', async () => {
    const { wrapper } = await mountPage('/population');
    await enter(wrapper, 'ecos0r', '200');
    const item = wrapper.find('#production-fieldset li[data-guid="10045"]');
    await item.find('.productivity input').trigger('focusin');
    await flushPromises();
    globalThis.dispatchEvent(new MouseEvent('click'));
    await flushPromises();
    expect(item.classes()).not.toContain('active');
    expect(item.classes()).toContain('selected');
    await wrapper.find('#display-options .show_production').trigger('click');
    await flushPromises();
    expect(item.classes()).not.toContain('selected');
    expect(wrapper.find('#commodity-chain-target').isVisible()).toBe(false);
  });

  it('switches the chain target between demand and maximum production', async () => {
    const { wrapper } = await mountPage('/population');
    await enter(wrapper, 'ecos0r', '250');
    await wrapper.find('#production-fieldset li[data-guid="10045"]').trigger('click');
    await flushPromises();
    const target = (): string => wrapper.find('#commodity-chain-container dl.chain dt .target').text();
    // The population demand of fish, then the output of the 11 needed fisheries.
    expect(target()).toBe('20.9');
    const select = wrapper.find('#commodity-chain-target a.ui-selectmenu');
    await select.trigger('keydown', { key: 'ArrowDown' });
    await flushPromises();
    expect(target()).toBe('22');
  });

  it('uses the productivity for the maximum production of the needed buildings', async () => {
    const { wrapper } = await mountPage('/population');
    await enter(wrapper, 'ecos0r', '250');
    const input = wrapper.find('#production-fieldset li[data-guid="10045"] .productivity input');
    await input.setValue('200');
    await input.trigger('change');
    await wrapper.find('#production-fieldset li[data-guid="10045"]').trigger('click');
    await flushPromises();
    await wrapper.find('#commodity-chain-target a.ui-selectmenu').trigger('keydown', { key: 'ArrowDown' });
    await flushPromises();
    // Six fisheries at 200 % produce 24 t/min, not the 12 t/min the old site requested.
    expect(wrapper.find('#commodity-chain-container dl.chain dt .target').text()).toBe('24');
    expect(wrapper.find('#commodity-chain-container .production .count').text()).toBe('×6');
  });
});
