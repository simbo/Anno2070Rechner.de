<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useCatalog } from '../catalog';
import CommodityChain from '../components/commodity-chain.vue';
import type { SelectOption } from '../components/select-option';
import UiAutocomplete from '../components/ui-autocomplete.vue';
import UiSelectMenu from '../components/ui-select-menu.vue';
import { useI18n } from '../i18n';
import { phpFloatval, phpIntval, phpNumber, phpStrnatcasecmp } from '../lib/php';
import type { ChainRequest } from '../models/commodity-chain';
import { productionSuggestions } from '../models/database';
import type { ProductionBuilding } from '../models/game-data';

/**
 * The commodity chain page: choose or search a production building, set a count or a
 * target output, and see its chain. URL parameters `pb_guid`, `count` and `target_tpm`
 * preselect the form as on the old site.
 */
const route = useRoute();
const router = useRouter();
const catalog = useCatalog();
const { t } = useI18n();

const query = (key: string): string | undefined => {
  const value = route.query[key];
  return typeof value === 'string' ? value : undefined;
};

/**
 * A select option for a production building.
 *
 * @param building - The building.
 * @returns The option.
 */
const option = (building: ProductionBuilding): SelectOption => ({ value: String(building.guid), label: building.name });

/**
 * Whether a building processes raw materials.
 *
 * @param building - The building.
 * @returns True for factories.
 */
const hasRaw = (building: ProductionBuilding): boolean => building.raw1 !== null || building.raw2 !== null;

// Buildings with raw materials first, then the others after a dash, as on the old page.
const options = computed(() => {
  const buildings = [...catalog.value.productionBuildings.values()].sort((a, b) => phpStrnatcasecmp(a.name, b.name));
  return [
    ...buildings.filter(building => hasRaw(building)).map(building => option(building)),
    { value: '', label: '—' },
    ...buildings.filter(building => !hasRaw(building)).map(building => option(building)),
  ];
});

const initialGuid = String(phpIntval(query('pb_guid')));
const knownGuid = options.value.some(entry => entry.value === initialGuid);
const search = ref('');
const searchGuid = ref('');
const pbGuid = ref(knownGuid ? initialGuid : options.value[0].value);
const initialCount = phpIntval(query('count'));
const count = ref(String(Math.max(1, initialCount)));
const targetTpm = query('target_tpm');
// The old form showed the target as PHP printed the parsed number.
const initialTarget = targetTpm === undefined ? undefined : phpFloatval(targetTpm.replace(/,/g, '.'));
const tpmNeeded = ref(initialTarget === undefined ? '' : phpNumber(initialTarget));

/**
 * Choosing in the list submits after this delay, in milliseconds, as on the old page.
 */
const SELECT_DELAY = 600;

const request = ref<ChainRequest>();

/**
 * Calculates the chain for the form values and keeps them in the URL.
 */
function submit(): void {
  if (searchGuid.value !== '') {
    pbGuid.value = searchGuid.value;
    searchGuid.value = '';
  }
  const next: ChainRequest = { pbGuid: pbGuid.value, count: count.value, tpmNeeded: tpmNeeded.value };
  if (!catalog.value.productionBuildings.has(phpIntval(next.pbGuid))) return;
  request.value = next;
  // Keep the URL shareable, with the parameter names of the old site.
  const urlQuery: Record<string, string> = { pb_guid: pbGuid.value };
  if (count.value !== '1') urlQuery.count = count.value;
  if (tpmNeeded.value !== '') urlQuery.target_tpm = tpmNeeded.value;
  void router.replace({ query: urlQuery });
}

let selectTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

/**
 * Submits shortly after a building was chosen in the list.
 *
 * @param value - The chosen value; the dash submits nothing.
 */
function onSelect(value: string): void {
  search.value = '';
  globalThis.clearTimeout(selectTimer);
  if (value !== '') selectTimer = globalThis.setTimeout(submit, SELECT_DELAY);
}

/**
 * A suggestion of the building search.
 */
interface BuildingSuggestion {
  label: string;
  value: string;
  guid: number;
}

/**
 * Shows the chain of a building chosen in the search.
 *
 * @param item - The chosen suggestion.
 */
function onSearchSelect(item: BuildingSuggestion): void {
  searchGuid.value = String(item.guid);
  submit();
}

const suggestions = (term: string): BuildingSuggestion[] =>
  productionSuggestions(catalog.value, term).map(suggestion => ({
    label: suggestion.name,
    value: suggestion.name,
    guid: suggestion.guid,
  }));

submit();
</script>

<template>
  <h2 class="commoditychains">{{ t('Produktionsketten') }}</h2>
  <form id="commoditychains-form" action="get-commoditychain" method="post" @submit.prevent="submit">
    <fieldset class="blue">
      <dl>
        <dt>
          <label>{{ t('Suche') }}</label>
        </dt>
        <dd>
          <UiAutocomplete
            v-model="search"
            :source="suggestions"
            name="search"
            tabindex="1"
            :data-guid="searchGuid"
            data-autocomplete="search-autocomplete"
            :placeholder="t('Gebäude oder Ware')"
            @select="onSearchSelect"
          />
        </dd>
        <dt>
          <label>{{ t('Produktionsgebäude') }}</label>
        </dt>
        <dd>
          <UiSelectMenu
            v-model="pbGuid"
            :options="options"
            name="pb_guid"
            tabindex="1"
            select-class="full"
            @select="onSelect"
          />
        </dd>
        <dt>
          <label>{{ t('Anzahl') }}</label>
        </dt>
        <dd>
          <input v-model="count" type="text" class="full" name="count" tabindex="2" />
        </dd>
        <dt>
          <label :title="t('Sollproduktion in Tonnen pro Minute')">{{ t('Soll TPM') }}</label>
        </dt>
        <dd>
          <input
            v-model="tpmNeeded"
            type="text"
            class="full"
            name="tpm_needed"
            tabindex="2"
            :placeholder="`(${t('automatisch')})`"
          />
        </dd>
        <dd>
          <input type="submit" :value="t('Berechnen')" tabindex="3" class="full" />
        </dd>
      </dl>
    </fieldset>
  </form>
  <div id="commodity-chain-container">
    <Transition name="fade" appear>
      <CommodityChain v-if="request" :catalog="catalog" :request="request" />
    </Transition>
  </div>
  <div class="clear"></div>
</template>
