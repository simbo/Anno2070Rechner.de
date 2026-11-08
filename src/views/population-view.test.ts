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

/**
 * Types a productivity into a building box of the chain.
 *
 * @param wrapper - The mounted page.
 * @param guid - The building guid.
 * @param text - The productivity.
 */
async function typeInChain(wrapper: VueWrapper, guid: string, text: string): Promise<void> {
  const input = wrapper.find(`#commodity-chain-container .production[data-guid="${guid}"] .productivity input`);
  await input.setValue(text);
  await input.trigger('change');
  await flushPromises();
}

/**
 * Shows the chain of electronics, which has an alternative copper producer.
 *
 * @param wrapper - The mounted page.
 */
async function selectElectronics(wrapper: VueWrapper): Promise<void> {
  await wrapper.find('#production-fieldset li[data-guid="10186"]').trigger('click');
  await flushPromises();
}

/**
 * Shows a building's chain with the maximum production as target.
 *
 * @param wrapper - The mounted page.
 * @param guid - The building guid.
 */
async function selectForMaximum(wrapper: VueWrapper, guid: string): Promise<void> {
  await wrapper.find(`#production-fieldset li[data-guid="${guid}"]`).trigger('click');
  await flushPromises();
  await wrapper.find('#commodity-chain-target a.ui-selectmenu').trigger('keydown', { key: 'ArrowDown' });
  await flushPromises();
}

/**
 * Opens the slider of a building in the chain, as focusing its input does.
 *
 * @param wrapper - The mounted page.
 * @param guid - The building guid.
 */
async function openChainSlider(wrapper: VueWrapper, guid: string): Promise<void> {
  const input = wrapper.find(`#commodity-chain-container .production[data-guid="${guid}"] .productivity input`);
  await input.trigger('focus');
  await flushPromises();
}

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
    expect(demandTexts(wrapper).slice(0, 5)).toEqual(['40,4', '15,6', '17,5', '11,8', '4,8']);
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

  it('resets inputs and the upgrade levels, so new houses use all levels again', async () => {
    const { wrapper } = await mountPage('/population');
    await enter(wrapper, 'ecos0r', '137');
    await wrapper.find('#residences-fieldset dl.ecos .ui-slider-handle').trigger('keydown', { key: 'ArrowLeft' });
    await wrapper.find('#residences-fieldset dl.ecos .ui-slider-handle').trigger('keyup', { key: 'ArrowLeft' });
    expect(value(wrapper, 'ecos_max_upgrade')).toBe('3');
    await wrapper.find('#residences-fieldset input.reset').trigger('click');
    await flushPromises();
    expect(value(wrapper, 'ecos0r')).toBe('0');
    expect(value(wrapper, 'ecos0i')).toBe('0');
    expect(value(wrapper, 'ecos_max_upgrade')).toBe('4');
    expect(wrapper.find('#residences-fieldset dl.ecos .ui-slider-handle').attributes('style')).toContain('left: 100%');
    await enter(wrapper, 'ecos0r', '250');
    expect(value(wrapper, 'ecos4r')).toBe('48');
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

  describe('sync between chain and production field', () => {
    it('updates input, count and efficiency of the field at once for the top building', async () => {
      const { wrapper } = await mountPage('/population');
      await enter(wrapper, 'ecos0r', '250');
      const field = wrapper.find('#production-fieldset li[data-guid="10045"]');
      await field.trigger('click');
      await flushPromises();
      expect(field.find('.count span').text()).toBe('11');
      await typeInChain(wrapper, '10045', '200');
      expect((field.find('.productivity input').element as HTMLInputElement).value).toBe('200');
      expect(field.find('.count span').text()).toBe('6');
      expect(field.find('.efficiency').text()).toBe('87%');
      expect(wrapper.find('#commodity-chain-container .production .count').text()).toBe('×6');
      const stored = JSON.parse(required(localStorage.getItem('anno2070rechner:population'))) as {
        productivity: Record<string, string>;
      };
      expect(stored.productivity['10045']).toBe('200');
    });

    it('does not reload the chain for the synced productivity', async () => {
      const { wrapper } = await mountPage('/population');
      await enter(wrapper, 'ecos0r', '250');
      await wrapper.find('#production-fieldset li[data-guid="10045"]').trigger('click');
      await flushPromises();
      await typeInChain(wrapper, '10045', '200');
      const efficiency = wrapper.find('#commodity-chain-container .production .efficiency');
      // A reloaded chain would label its efficiency again; an updated building does not.
      expect(efficiency.find('em').exists()).toBe(false);
      await wrapper.find('#production-fieldset li[data-guid="10045"] .productivity input').trigger('blur');
      await flushPromises();
      expect(wrapper.find('#commodity-chain-container .production .efficiency em').exists()).toBe(false);
    });

    it('leaves the field alone for buildings further down the chain', async () => {
      const { wrapper } = await mountPage('/population');
      await enter(wrapper, 'ecos0r', '2000');
      const field = wrapper.find('#production-fieldset li[data-guid="10186"]');
      await field.trigger('click');
      await flushPromises();
      const child = required(wrapper.findAll('#commodity-chain-container dl.chain dd .production').at(1));
      await typeInChain(wrapper, required(child.attributes('data-guid')), '200');
      expect((field.find('.productivity input').element as HTMLInputElement).value).toBe('100');
    });

    describe('with the maximum production as target', () => {
      const chainCount = (wrapper: VueWrapper): string =>
        wrapper.find('#commodity-chain-container .production .count').text();
      const chainTarget = (wrapper: VueWrapper): string =>
        wrapper.find('#commodity-chain-container dl.chain dt .target').text();
      const fieldCount = (wrapper: VueWrapper, guid: string): string =>
        wrapper.find(`#production-fieldset li[data-guid="${guid}"] .count span`).text();

      it('keeps the target while typing and reloads after a click elsewhere', async () => {
        const { wrapper } = await mountPage('/population');
        await enter(wrapper, 'ecos0r', '250');
        await selectForMaximum(wrapper, '10045');
        expect(chainTarget(wrapper)).toBe('22');
        await openChainSlider(wrapper, '10045');
        await typeInChain(wrapper, '10045', '105');
        // 22 t/min still need 11 buildings, while the demand of 20.9 t/min needs 10.
        expect(chainTarget(wrapper)).toBe('22');
        expect(chainCount(wrapper)).toBe('×11');
        expect(fieldCount(wrapper, '10045')).toBe('10');
        globalThis.dispatchEvent(new MouseEvent('click'));
        await flushPromises();
        expect(chainTarget(wrapper)).toBe('21');
        expect(chainCount(wrapper)).toBe('×10');
        expect(fieldCount(wrapper, '10045')).toBe('10');
      });

      it('reloads when the slider is released', async () => {
        const { wrapper } = await mountPage('/population');
        await enter(wrapper, 'ecos0r', '250');
        await selectForMaximum(wrapper, '10045');
        await openChainSlider(wrapper, '10045');
        const handle = wrapper.find('#commodity-chain-container .production .ui-slider-handle');
        await handle.trigger('keydown', { key: 'ArrowRight' });
        expect(chainTarget(wrapper)).toBe('22');
        await handle.trigger('keyup', { key: 'ArrowRight' });
        await flushPromises();
        expect(chainTarget(wrapper)).toBe('22.2');
      });

      it('reloads when the focus moves on from the input, but not to its own slider', async () => {
        const { wrapper } = await mountPage('/population');
        await enter(wrapper, 'ecos0r', '250');
        await selectForMaximum(wrapper, '10045');
        await openChainSlider(wrapper, '10045');
        await typeInChain(wrapper, '10045', '105');
        const input = wrapper.find('#commodity-chain-container .production .productivity input');
        const handle = wrapper.find('#commodity-chain-container .production .ui-slider-handle');
        await input.trigger('focusout', { relatedTarget: handle.element });
        await flushPromises();
        expect(chainTarget(wrapper)).toBe('22');
        // Tab moves on from the input to the slider first, then out of the building.
        await handle.trigger('focusout', { relatedTarget: wrapper.find('input[name=ecos0r]').element });
        await flushPromises();
        expect(chainTarget(wrapper)).toBe('21');
      });

      it('keeps chosen alternatives and productivities when reloading', async () => {
        const { wrapper } = await mountPage('/population');
        await enter(wrapper, 'ecos0r', '2000');
        await selectForMaximum(wrapper, '10186');
        const alternative = required(wrapper.findAll('#commodity-chain-container dd.alt .production').at(0));
        const guid = required(alternative.attributes('data-guid'));
        await alternative.trigger('click');
        await typeInChain(wrapper, guid, '250');
        await openChainSlider(wrapper, '10186');
        await typeInChain(wrapper, '10186', '200');
        globalThis.dispatchEvent(new MouseEvent('click'));
        await flushPromises();
        expect(chainCount(wrapper)).toBe(`×${fieldCount(wrapper, '10186')}`);
        const active = wrapper.findAll('#commodity-chain-container dd:not(.alt) .production');
        const restored = required(active.find(production => production.attributes('data-guid') === guid));
        expect((restored.find('.productivity input').element as HTMLInputElement).value).toBe('250');
      });
    });

    it('does not reload the chain after a click elsewhere with the population demand as target', async () => {
      const { wrapper } = await mountPage('/population');
      await enter(wrapper, 'ecos0r', '250');
      await wrapper.find('#production-fieldset li[data-guid="10045"]').trigger('click');
      await flushPromises();
      await wrapper.find('#commodity-chain-container .production .productivity input').trigger('focus');
      await typeInChain(wrapper, '10045', '200');
      globalThis.dispatchEvent(new MouseEvent('click'));
      await flushPromises();
      expect(wrapper.find('#commodity-chain-container .production .efficiency em').exists()).toBe(false);
      expect(wrapper.find('#commodity-chain-container dl.chain dt .target').text()).toBe('20.9');
    });
  });

  describe('chain settings', () => {
    const alternatives = (wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> =>
      wrapper.findAll('#commodity-chain-container dd.alt .production');
    const activeGuids = (wrapper: VueWrapper): (string | undefined)[] =>
      wrapper
        .findAll('#commodity-chain-container dd:not(.alt) .production')
        .map(production => production.attributes('data-guid'));

    it('restores chosen alternatives and productivities when a chain is shown again', async () => {
      const { wrapper } = await mountPage('/population');
      await enter(wrapper, 'ecos0r', '2000');
      await selectElectronics(wrapper);
      const alternative = required(alternatives(wrapper).at(0));
      const guid = required(alternative.attributes('data-guid'));
      await alternative.trigger('click');
      expect(activeGuids(wrapper)).toContain(guid);

      const child = wrapper.find(`#commodity-chain-container .production[data-guid="${guid}"] .productivity input`);
      await child.setValue('250');
      await child.trigger('change');
      await flushPromises();

      await wrapper.find('#production-fieldset li[data-guid="10045"]').trigger('click');
      await flushPromises();
      expect(activeGuids(wrapper)).toEqual(['10045']);

      await selectElectronics(wrapper);
      expect(activeGuids(wrapper)).toContain(guid);
      const restored = wrapper.find(`#commodity-chain-container .production[data-guid="${guid}"] .productivity input`);
      expect((restored.element as HTMLInputElement).value).toBe('250');
    });

    it('keeps the settings of each building apart and forgets them on reset', async () => {
      const { wrapper } = await mountPage('/population');
      await enter(wrapper, 'ecos0r', '2000');
      await selectElectronics(wrapper);
      await required(alternatives(wrapper).at(0)).trigger('click');
      await flushPromises();
      const stored = (): Record<string, unknown> =>
        (
          JSON.parse(required(localStorage.getItem('anno2070rechner:population'))) as {
            chains: Record<string, unknown>;
          }
        ).chains;
      expect(Object.keys(stored())).toEqual(['10186']);
      await wrapper.find('#residences-fieldset input.reset').trigger('click');
      await flushPromises();
      expect(stored()).toEqual({});
    });
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
