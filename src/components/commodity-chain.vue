<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, reactive, ref, watch } from 'vue';

import { useI18n } from '../i18n';
import {
  allGroups,
  chainSettings,
  chooseAlternative,
  createChainState,
  followUp,
  recalculationRequest,
  summarize,
  updateProductivity,
  type ChainSettings,
  type ChainState,
  type GroupState,
  type ProductionState,
} from '../models/chain-state';
import { summaryPair, type ChainRequest } from '../models/commodity-chain';
import type { Catalog } from '../models/game-data';

import { chainControllerKey } from './chain-controller';
import ChainGroup from './chain-group.vue';

/**
 * A commodity chain with summary, alternatives and productivity sliders, like the chain
 * the old site loaded from `get-commoditychain` and enhanced with jQuery.
 */
const props = defineProps<{ catalog: Catalog; request: ChainRequest }>();

const emit = defineEmits<{
  /**
   * The visitor changed a productivity or chose an alternative.
   */
  settings: [settings: ChainSettings];

  /**
   * The visitor changed the productivity of the top building.
   */
  rootProductivity: [text: string];

  /**
   * The visitor finished changing the productivity of the top building.
   */
  rootSettled: [];
}>();

const { t } = useI18n();
const state = ref<ChainState>();
const root = ref<HTMLElement>();

/**
 * Calculates and shows a chain.
 *
 * @param request - The chain request.
 */
function load(request: ChainRequest): void {
  const next = createChainState(props.catalog, request);
  state.value = next ? reactive(next) : undefined;
}

watch(
  () => [props.catalog, props.request] as const,
  ([, request]) => {
    load(request);
  },
  { immediate: true, deep: true },
);

/**
 * Closes a building's slider and recalculates or summarizes like the old site.
 *
 * @param group - The level of the building.
 * @param production - The building.
 */
function deactivate(group: GroupState, production: ProductionState): void {
  production.active = false;
  const chain = state.value;
  if (!chain) return;
  const next = followUp(chain, group, production);
  if (next === 'recalculate') load(recalculationRequest(chain));
  else if (next === 'summarize') chain.summary = summarize(chain);
  if (production === chain.root.productions[0]) emit('rootSettled');
}

/**
 * All levels of the shown chain.
 *
 * @returns The levels, or none without a chain.
 */
const groups = (): GroupState[] => (state.value ? allGroups(state.value.root) : []);

provide(chainControllerKey, {
  choose: (group, production) => {
    if (!state.value) return;
    chooseAlternative(state.value, group, production);
    emit('settings', chainSettings(state.value));
  },
  activate: production => {
    production.active = true;
    for (const group of groups()) {
      for (const other of group.productions) if (other !== production && other.active) deactivate(group, other);
    }
  },
  deactivate,
  leave: production => {
    if (production === state.value?.root.productions[0]) emit('rootSettled');
  },
  productivity: (production, text) => {
    updateProductivity(production, text);
    if (!state.value) return;
    emit('settings', chainSettings(state.value));
    if (production === state.value.root.productions[0]) emit('rootProductivity', text);
  },
});

/**
 * Closes the open slider when the visitor clicks outside its focused input.
 */
function onWindowClick(): void {
  if (root.value?.querySelector(':scope .production.active .productivity :focus')) return;
  for (const group of groups()) {
    for (const production of group.productions) if (production.active) deactivate(group, production);
  }
}
onMounted(() => {
  globalThis.addEventListener('click', onWindowClick);
});
onBeforeUnmount(() => {
  globalThis.removeEventListener('click', onWindowClick);
});
</script>

<template>
  <div v-if="state" ref="root" class="commodity-chain">
    <div v-if="state.summary" class="summary">
      <dl class="productions">
        <template v-for="production in state.summary.productions" :key="production.guid">
          <dt>×{{ production.count }}</dt>
          <dd>
            <span class="icon-16"
              ><span :style="`background-image:url('/img/icons/16/${production.icon}')`"></span></span
            >{{ production.name }}
          </dd>
        </template>
      </dl>
      <hr />
      <ul class="build-costs">
        <li class="credits" :title="t('Credits')">{{ state.summary.credits }}</li>
        <li
          v-for="cost in state.summary.buildCosts"
          :key="cost.guid"
          :style="`background-image:url('/img/icons/16/${cost.icon}')`"
          :title="cost.name"
        >
          {{ cost.value }}
        </li>
      </ul>
      <ul class="maintenance-costs">
        <li class="credits" :title="t('Bilanz')">{{ summaryPair(state.summary.maintenance.credits) }}</li>
        <li class="energy" :title="t('Energie')">{{ summaryPair(state.summary.maintenance.energy) }}</li>
        <li class="eco" :title="t('Ökobilanz')">{{ summaryPair(state.summary.maintenance.eco) }}</li>
      </ul>
      <div class="clear"></div>
    </div>
    <ChainGroup :group="state.root" />
  </div>
</template>
