<script setup lang="ts">
import { inject } from 'vue';

import { useI18n } from '../i18n';
import type { GroupState } from '../models/chain-state';

import { chainControllerKey } from './chain-controller';
import ChainProduction from './chain-production.vue';

/**
 * One level of a commodity chain and, recursively, its sub levels, like a `dl.chain` of
 * the old `GameData::drawCommodityChain()`.
 */
defineProps<{ group: GroupState }>();

const { t } = useI18n();
const controller = inject(chainControllerKey);
if (!controller) throw new Error('ChainGroup needs a CommodityChain around it');

const outputLabels = { tpm: 'Tonnen pro Minute', energy: 'Energie', eco: 'Ökobilanz' } as const;
</script>

<template>
  <dl class="chain">
    <dt>
      <div class="product">
        <span class="icon"
          ><span
            :style="`background-image:url('/img/icons/46/${group.view.product.icon}');`"
            :title="group.view.product.name"
          ></span></span
        ><span class="tpm" :title="t(outputLabels[group.view.output.kind])"
          ><span class="target">{{ group.view.output.value }}</span
          ><span class="tpm_unit">{{
            group.view.output.kind === 'tpm' ? 'tpm' : t(outputLabels[group.view.output.kind])
          }}</span></span
        >
      </div>
    </dt>
    <dd v-for="(production, index) in group.productions" :key="production.view.guid" :class="{ alt: index > 0 }">
      <ChainProduction
        :production="production"
        @click="index > 0 && controller.choose(group, production)"
        @activate="controller.activate(production)"
        @deactivate="controller.deactivate(group, production)"
        @productivity="controller.productivity(production, $event)"
      />
    </dd>
  </dl>
  <div class="clear"></div>
  <div v-for="(child, index) in group.children" :key="index" class="commodity-chain-inner">
    <ChainGroup :group="child" />
  </div>
</template>
