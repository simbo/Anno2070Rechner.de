<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useCatalog } from '../catalog';
import DatabaseBuilding from '../components/database-building.vue';
import UiAutocomplete from '../components/ui-autocomplete.vue';
import UiSelectMenu from '../components/ui-select-menu.vue';
import { useI18n } from '../i18n';
import { phpStrnatcasecmp } from '../lib/php';
import { databaseResults, nameSuggestions, type DatabaseQuery } from '../models/database';
import { pagePath } from '../routes';

/**
 * The database page: lists of production buildings, buildings and products, and a search.
 * The results follow the URL parameters `search`, `productionbuilding`, `building` and
 * `product`, as on the old site.
 */
const route = useRoute();
const router = useRouter();
const catalog = useCatalog();
const { language, t } = useI18n();

const queryKeys = ['search', 'productionbuilding', 'building', 'product'] as const;

const query = computed<DatabaseQuery>(() => {
  const result: DatabaseQuery = {};
  for (const key of queryKeys) {
    const value = route.query[key];
    if (typeof value === 'string') result[key] = value;
  }
  return result;
});

const results = computed(() => databaseResults(catalog.value, query.value));

/**
 * Select options for entries, sorted by name like the old lists.
 *
 * @param items - The entries.
 * @returns The options.
 */
const options = (items: Iterable<{ guid: number; name: string }>): { value: string; label: string }[] =>
  [...items]
    .toSorted((a, b) => phpStrnatcasecmp(a.name, b.name))
    .map(item => ({ value: String(item.guid), label: item.name }));

const productionOptions = computed(() => [
  { value: '', label: '—' },
  { value: 'all', label: `(${t('alle')})` },
  { value: 'factory', label: `(${t('alle Fabriken')})` },
  { value: 'farm', label: `(${t('alle Farmen')})` },
  { value: 'energy', label: `(${t('alle Energie erzeugenden')})` },
  { value: 'eco', label: `(${t('alle Ökobilanz erzeugenden')})` },
  ...options(catalog.value.productionBuildings.values()),
]);
const buildingOptions = computed(() => [
  { value: '', label: '—' },
  { value: 'all', label: `(${t('alle')})` },
  ...options(catalog.value.buildings.values()),
]);
const productOptions = computed(() => [
  { value: '', label: '—' },
  { value: 'all', label: `(${t('alle')})` },
  ...options(catalog.value.products.values()),
]);

const selected = ref({ productionbuilding: '', building: '', product: '' });
const search = ref(query.value.search ?? '');
const autocomplete = ref<{ close: () => void }>();

/**
 * Shows the results of a query and keeps it in the URL.
 *
 * @param next - The query parameters.
 */
function show(next: Record<string, string>): void {
  void router.replace({ path: pagePath('database', language.value), query: next });
  autocomplete.value?.close();
}

/**
 * Shows the list chosen in one select box and resets the other two, like the old form.
 *
 * @param key - The select box.
 */
function onSelect(key: keyof typeof selected.value): void {
  for (const other of Object.keys(selected.value) as (keyof typeof selected.value)[]) {
    if (other !== key) selected.value[other] = '';
  }
  // Empty lists add nothing to the results, so they stay out of the URL.
  show(Object.fromEntries(Object.entries(selected.value).filter(([, value]) => value !== '')));
}

const suggestions = (term: string): { label: string; value: string }[] =>
  nameSuggestions(catalog.value, term).map(name => ({ label: name, value: name }));

const producers = (guid: number): { guid: number; name: string; icon: string }[] =>
  catalog.value.productionBuildingsByProduct.get(guid) ?? [];
</script>

<template>
  <h2 class="database">{{ t('Datenbank') }}</h2>
  <form id="database-select-form" action="database" method="post" class="fright" @submit.prevent>
    <fieldset class="blue">
      <dl>
        <dt>
          <label>{{ t('Produktionsgebäude') }}</label>
        </dt>
        <dd>
          <UiSelectMenu
            v-model="selected.productionbuilding"
            :options="productionOptions"
            name="productionbuilding"
            tabindex="4"
            @select="onSelect('productionbuilding')"
          />
        </dd>
        <dt>
          <label>{{ t('Gebäude') }}</label>
        </dt>
        <dd>
          <UiSelectMenu
            v-model="selected.building"
            :options="buildingOptions"
            name="building"
            tabindex="4"
            @select="onSelect('building')"
          />
        </dd>
        <dt>
          <label>{{ t('Waren') }}</label>
        </dt>
        <dd>
          <UiSelectMenu
            v-model="selected.product"
            :options="productOptions"
            name="product"
            tabindex="4"
            @select="onSelect('product')"
          />
        </dd>
      </dl>
    </fieldset>
  </form>
  <form id="database-search-form" action="database" method="post" @submit.prevent="show({ search })">
    <fieldset class="blue">
      <dl>
        <dt>
          <label>{{ t('Suche nach') }}</label>
        </dt>
        <dd>
          <UiAutocomplete
            ref="autocomplete"
            v-model="search"
            :source="suggestions"
            name="search"
            tabindex="1"
            data-autocomplete="search-autocomplete"
          />
        </dd>
        <dd>
          <input type="submit" :value="t('Suchen')" tabindex="2" />
        </dd>
      </dl>
    </fieldset>
  </form>
  <div id="database-results" class="results">
    <template v-if="results.productionBuildings.length > 0">
      <h3>{{ t('Produktionsgebäude') }}</h3>
      <DatabaseBuilding
        v-for="building in results.productionBuildings"
        :key="building.guid"
        :building="building"
        @query="show"
      />
      <div class="clear"></div>
    </template>
    <template v-if="results.buildings.length > 0">
      <h3>{{ t('Gebäude') }}</h3>
      <DatabaseBuilding v-for="building in results.buildings" :key="building.guid" :building="building" @query="show" />
      <div class="clear"></div>
    </template>
    <template v-if="results.products.length > 0">
      <h3>{{ t('Waren') }}</h3>
      <div v-for="product in results.products" :key="product.guid" class="product">
        <span class="name">{{ product.name }}</span>
        <span class="details"
          >{{ t('produziert von') }}
          <template v-for="(producer, index) in producers(product.guid)" :key="producer.guid"
            ><a
              rel="database"
              :href="`${pagePath('database', language)}?productionbuilding=${producer.guid}`"
              :title="producer.name"
              @click.prevent="show({ productionbuilding: String(producer.guid) })"
              ><span class="icon-16"
                ><span :style="`background-image:url('/img/icons/16/${producer.icon}');`"></span></span></a
            >{{ index < producers(product.guid).length - 1 ? ' ' : '' }}</template
          ></span
        >
        <span class="icon-32"
          ><span :style="`background-image:url('/img/icons/32/${product.icon}');`" :title="product.name"></span
        ></span>
        <div class="clear"></div>
      </div>
      <div class="clear"></div>
    </template>
  </div>
</template>
