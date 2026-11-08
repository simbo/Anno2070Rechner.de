<script setup lang="ts">
import { computed } from 'vue';

import { useI18n } from '../i18n';
import { efficiencyClass, filterNum } from '../lib/legacy';
import type { ProductionState } from '../models/chain-state';

import UiSlider from './ui-slider.vue';

/**
 * One building box of a commodity chain, like the old `GameData::drawProduction()` output
 * plus its productivity input and slider.
 */
const props = defineProps<{ production: ProductionState }>();

const emit = defineEmits<{
  activate: [];
  deactivate: [];
  leave: [];
  productivity: [text: string];
}>();

const { t } = useI18n();

const view = computed(() => props.production.view);
const adjustment = computed(() => props.production.adjustment);

const sliderValue = computed({
  get: () => filterNum(props.production.productivity),
  set: (value: number) => {
    emit('productivity', String(value));
  },
});

/**
 * Highest productivity the input accepts, in percent.
 */
const MAX_PRODUCTIVITY = 999;

let lastValue = '';

/**
 * Selects the input text and opens the slider.
 *
 * @param event - The focus event.
 */
function onFocus(event: FocusEvent): void {
  (event.target as HTMLInputElement).select();
  emit('activate');
}

/**
 * Applies the typed productivity like the old input handler: clamped to 1 to 999 percent.
 *
 * @param input - The productivity input.
 */
function commit(input: HTMLInputElement): void {
  const value = Math.max(1, Math.min(MAX_PRODUCTIVITY, filterNum(input.value)));
  input.value = String(value);
  emit('productivity', String(value));
}

/**
 * Applies the input as soon as its text changed.
 *
 * @param event - The keyboard event.
 */
function onKeyUp(event: KeyboardEvent): void {
  const input = event.target as HTMLInputElement;
  if (input.value !== '' && lastValue !== input.value) commit(input);
}

/**
 * Reports that the focus moved on to something outside this building. A click on nothing
 * focusable is left to the window click handler; it may also be the start of a slider drag.
 *
 * @param event - The focus event.
 */
function onFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null;
  if (next && !(event.currentTarget as HTMLElement).contains(next)) emit('leave');
}
</script>

<template>
  <div
    class="production"
    :class="{ active: production.active, changed: adjustment.changed }"
    :data-guid="view.guid"
    :data-count="adjustment.count"
    :data-multiplier="view.multiplier"
    :data-icon="view.icon"
    :data-tpm="view.tpm"
    :data-tpm-needed="view.tpmNeeded"
    @focusout="onFocusOut"
  >
    <span class="alt-text">{{ t('Alternatives Produktionsgebäude') }}</span>
    <span class="icon-32"
      ><span :style="`background-image:url('/img/icons/32/${view.icon}');`" :title="view.name"></span
    ></span>
    <span class="count">×{{ adjustment.count }}</span>
    <span class="name">{{ view.name }}</span>
    <span
      v-if="production.updated"
      class="efficiency"
      :class="efficiencyClass(adjustment.efficiency)"
      :title="t('Effizienz')"
      >{{ adjustment.efficiency }}%</span
    >
    <span v-else class="efficiency" :class="view.efficiencyClass" :title="t('Effizienz')"
      >{{ view.efficiency }}% <em>{{ t('Effizienz') }}</em></span
    >
    <span
      class="productivity"
      :title="t('max. Produktivität')"
      @click.stop="($event.currentTarget as HTMLElement).querySelector('input')?.focus()"
    >
      <em>{{ t('max. Produktivität') }}</em>
      <input
        type="text"
        :name="`productivity_${view.guid}`"
        :value="production.productivity"
        @focus="onFocus"
        @keydown="lastValue = ($event.target as HTMLInputElement).value"
        @keyup="onKeyUp"
        @change="commit($event.target as HTMLInputElement)"
      /><span class="percent">%</span>
      <div class="slider-container">
        <UiSlider v-model="sliderValue" class="slider" :min="50" :max="300" @stop="emit('deactivate')" />
      </div>
    </span>
    <ul class="build-costs">
      <li class="credits" :title="t('Credits')">{{ adjustment.credits }}</li>
      <li
        v-for="(cost, index) in view.buildCosts"
        :key="cost.guid"
        :style="`background-image:url('/img/icons/16/${cost.icon}');`"
        :title="cost.name"
        :data-guid="cost.guid"
      >
        {{ adjustment.buildCosts[index] }}
      </li>
    </ul>
    <ul class="maintenance-costs">
      <li class="credits" :title="t('Bilanz')">{{ adjustment.maintenance.credits }}</li>
      <li class="energy" :title="t('Energie')">{{ adjustment.maintenance.energy }}</li>
      <li class="eco" :title="t('Ökobilanz')">{{ adjustment.maintenance.eco }}</li>
    </ul>
    <div class="clear"></div>
  </div>
</template>
