<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useCatalog } from '../catalog';
import CommodityChain from '../components/commodity-chain.vue';
import type { SelectOption } from '../components/select-option';
import UiAutocomplete from '../components/ui-autocomplete.vue';
import UiSelectMenu from '../components/ui-select-menu.vue';
import { useI18n } from '../i18n';
import { phpFloatval, phpIntval, phpNumber, phpStrnatcasecmp } from '../lib/php';
import type { ChainSettings } from '../models/chain-state';
import { formatAlternatives, formatProductivities, parseChainUrl } from '../models/chain-url';
import type { ChainRequest } from '../models/commodity-chain';
import { productionSuggestions } from '../models/database';
import type { ProductionBuilding } from '../models/game-data';

/**
 * The commodity chain page: choose or search a production building, set a count or a
 * target output, and see its chain. URL parameters `pb_guid`, `count` and `target_tpm`
 * preselect the form as on the old site; `prod` and `alt` hold what was set in the chain.
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

const search = ref('');
const searchGuid = ref('');
const pbGuid = ref('');
const count = ref('1');
const tpmNeeded = ref('');

/**
 * Productivities set in the chain, per building guid, and the chosen alternatives. They live
 * in the URL too, so that a chain keeps them when reloaded or shared.
 */
const productivity = ref<Record<string, string>>({});
const alternatives = ref<number[]>([]);

/**
 * The target the chain keeps after its top building's productivity changed. It stays out of
 * the form, because the visitor did not enter it.
 */
const keptTarget = ref<string>();

/**
 * Choosing in the list submits after this delay, in milliseconds, as on the old page.
 */
const SELECT_DELAY = 600;

/**
 * Changes in the chain reach the URL after this delay, in milliseconds, so that moving a
 * slider does not write every position.
 */
const URL_DELAY = 300;

const request = ref<ChainRequest>();

// The query this page wrote itself; any other query comes from a link and is applied.
let writtenQuery = '';
let urlTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

/**
 * Keeps the state in the URL, with the parameter names of the old site where they exist.
 */
function writeUrl(): void {
  globalThis.clearTimeout(urlTimer);
  const urlQuery: Record<string, string> = { pb_guid: pbGuid.value };
  if (count.value !== '1') urlQuery.count = count.value;
  const target = tpmNeeded.value === '' ? keptTarget.value : tpmNeeded.value;
  if (target !== undefined) urlQuery.target_tpm = target;
  const prod = formatProductivities(productivity.value);
  if (prod !== undefined) urlQuery.prod = prod;
  const alt = formatAlternatives(catalog.value, alternatives.value);
  if (alt !== undefined) urlQuery.alt = alt;
  writtenQuery = JSON.stringify(urlQuery);
  void router.replace({ query: urlQuery });
}

/**
 * Calculates the chain for the form values and keeps them in the URL.
 */
function submit(): void {
  if (searchGuid.value !== '') {
    pbGuid.value = searchGuid.value;
    searchGuid.value = '';
  }
  if (!catalog.value.productionBuildings.has(phpIntval(pbGuid.value))) return;
  // Settings belong to the chain of one building.
  if (request.value && String(request.value.pbGuid) !== pbGuid.value) {
    productivity.value = {};
    alternatives.value = [];
  }
  keptTarget.value = undefined;
  const next: ChainRequest = { pbGuid: pbGuid.value, count: count.value, tpmNeeded: tpmNeeded.value };
  if (Object.keys(productivity.value).length > 0) next.productivity = { ...productivity.value };
  if (alternatives.value.length > 0) next.preferred = [...alternatives.value];
  request.value = next;
  writeUrl();
}

/**
 * Fills the form from the URL and shows the chain, as a link to this page expects.
 */
function applyQuery(): void {
  const guid = String(phpIntval(query('pb_guid')));
  pbGuid.value = options.value.some(entry => entry.value === guid) ? guid : options.value[0].value;
  const buildings = Math.max(1, phpIntval(query('count')));
  count.value = String(buildings);
  const targetTpm = query('target_tpm');
  // The old form showed the target as PHP printed the parsed number.
  const target = targetTpm?.replace(/,/g, '.');
  tpmNeeded.value = target === undefined ? '' : phpNumber(phpFloatval(target));
  const settings = parseChainUrl(catalog.value, query('prod'), query('alt'));
  productivity.value = settings.productivity;
  alternatives.value = settings.preferred;
  request.value = undefined;
  submit();
}

/**
 * Takes over what the visitor set in the chain.
 *
 * @param settings - The settings of the chain.
 */
function onChainSettings(settings: ChainSettings): void {
  const root = pbGuid.value;
  const rootProductivity = productivity.value[root] as string | undefined;
  productivity.value = {
    ...settings.productivity,
    ...(rootProductivity !== undefined && { [root]: rootProductivity }),
  };
  alternatives.value = settings.preferred;
  globalThis.clearTimeout(urlTimer);
  urlTimer = globalThis.setTimeout(writeUrl, URL_DELAY);
}

/**
 * Takes over the productivity of the top building. The chain keeps its target meanwhile, so
 * that target has to be part of the URL for the chain to look the same when reloaded.
 *
 * @param text - The productivity in percent.
 * @param target - The target of the chain in tons per minute.
 */
function onChainRootProductivity(text: string, target: string): void {
  productivity.value = { ...productivity.value, [pbGuid.value]: text };
  keptTarget.value = target;
  globalThis.clearTimeout(urlTimer);
  urlTimer = globalThis.setTimeout(writeUrl, URL_DELAY);
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

applyQuery();

watch(
  () => route.query,
  next => {
    if (JSON.stringify(next) !== writtenQuery) applyQuery();
  },
);

onBeforeUnmount(() => {
  globalThis.clearTimeout(urlTimer);
  globalThis.clearTimeout(selectTimer);
});
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
      <CommodityChain
        v-if="request"
        :catalog="catalog"
        :request="request"
        @settings="onChainSettings"
        @root-productivity="onChainRootProductivity"
      />
    </Transition>
  </div>
  <div class="clear"></div>
</template>
