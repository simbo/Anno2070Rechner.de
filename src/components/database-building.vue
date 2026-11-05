<script setup lang="ts">
import { computed } from 'vue';

import { useCatalog } from '../catalog';
import { useI18n } from '../i18n';
import { buildingView, type BuildingView } from '../models/building-view';
import type { BuildingData } from '../models/game-data';
import { pagePath } from '../routes';

import AppLink from './app-link.vue';

/**
 * A building in the database results, like the old `GameData::drawBuilding()`. Links to
 * products update the results; production buildings link to their commodity chain.
 */
const props = defineProps<{ building: BuildingData & { name: string } }>();

const emit = defineEmits<{ query: [query: Record<string, string>] }>();

const catalog = useCatalog();
const { language, t } = useI18n();

const view = computed<BuildingView>(() => buildingView(catalog.value, props.building));
const databasePath = computed(() => pagePath('database', language.value));
</script>

<template>
  <div class="building" :class="{ productionbuilding: view.production }">
    <span class="icon-32"
      ><span :style="`background-image:url('/img/icons/32/${view.icon}');`" :title="view.name"></span
    ></span>
    <span class="name">{{ view.name }}</span>
    <template v-if="view.production">
      <!-- Spaces are explicit: the old markup separates label, value and icon with single spaces. -->
      <span class="details"
        >{{ t('produziert') }}{{ ' '
        }}<strong>{{ view.production.tpm }}{{ view.production.inTons ? ' tpm' : '' }}</strong
        >{{ ' '
        }}<a
          rel="database"
          :href="`${databasePath}?product=${view.production.product?.guid}`"
          :title="view.production.product?.name"
          @click.prevent="emit('query', { product: String(view.production.product?.guid) })"
          ><span class="icon-16"
            ><span :style="`background-image:url('/img/icons/16/${view.production.product?.icon}');`"></span></span></a
        ><br
      /></span>
      <span v-if="view.production.raws.length > 0" class="details"
        >{{ t('benötigt')
        }}<template v-for="raw in view.production.raws" :key="raw.product?.guid"
          >{{ ' ' }}<strong>{{ raw.tpm }} tpm</strong>{{ ' '
          }}<a
            rel="database"
            :href="`${databasePath}?product=${raw.product?.guid}`"
            :title="raw.product?.name"
            @click.prevent="emit('query', { product: String(raw.product?.guid) })"
            ><span class="icon-16"
              ><span :style="`background-image:url('/img/icons/16/${raw.product?.icon}');`"></span></span></a></template
      ></span>
      <AppLink
        class="show-cc"
        :to="{ path: pagePath('commoditychains', language), query: { pb_guid: String(view.guid) } }"
        :title="t('Produktionskette anzeigen')"
        ><img src="/img/icons/24/icon_27_483.png" :alt="t('Produktionskette anzeigen')"
      /></AppLink>
    </template>
    <ul class="build-costs">
      <li class="credits" :title="t('Credits')">{{ view.credits }}</li>
      <li
        v-for="cost in view.buildCosts"
        :key="cost.guid"
        :style="`background-image:url('/img/icons/16/${cost.icon}');`"
        :title="cost.name"
        :data-guid="cost.guid"
      >
        {{ cost.value }}
      </li>
    </ul>
    <ul class="maintenance-costs">
      <li class="credits" :title="t('Bilanz')">{{ view.maintenance.credits }}</li>
      <li class="energy" :title="t('Energie')">{{ view.maintenance.energy }}</li>
      <li class="eco" :title="t('Ökobilanz')">{{ view.maintenance.eco }}</li>
    </ul>
    <div class="clear"></div>
  </div>
</template>
