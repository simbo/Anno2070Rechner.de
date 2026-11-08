<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import { useCatalog } from '../catalog';
import CommodityChain from '../components/commodity-chain.vue';
import UiSelectMenu from '../components/ui-select-menu.vue';
import UiSlider from '../components/ui-slider.vue';
import { useI18n } from '../i18n';
import { filterNum } from '../lib/legacy';
import type { ChainSettings } from '../models/chain-state';
import type { ChainRequest } from '../models/commodity-chain';
import {
  calculateDemands,
  calculateProduction,
  distributeResidences,
  formatDemand,
  groups,
  levelCount,
  productionRows,
  residentsFromHouses,
  type Group,
  type Residents,
} from '../models/population';
import { usePopulationStore } from '../stores/population';

/**
 * The population calculator: houses or residents per faction lead to demands and the
 * needed production buildings; choosing one shows its commodity chain. It reproduces the
 * old calculator's behavior, including how inputs are cleaned up and when the chain updates.
 */
const catalog = useCatalog();
const { language, t } = useI18n();
const { inputs } = usePopulationStore();

/**
 * Highest productivity the inputs accept, in percent.
 */
const MAX_PRODUCTIVITY = 999;

/**
 * The old reset moved every upgrade slider to this level, also the shorter Techs slider.
 */
const RESET_UPGRADE = 4;

const levelNames: Record<Group, string[]> = {
  ecos: ['Arbeiter', 'Angestellte', 'Ingenieure', 'Executives'],
  tycoons: ['Arbeiter', 'Angestellte', 'Ingenieure', 'Executives'],
  techs: ['Laborgehilfen', 'Forscher'],
};

// Tab order of the old page: per faction total, slider, levels, information channel.
const residenceTabindex = (group: Group): number => ({ ecos: 1, tycoons: 8, techs: 15 })[group];
const inhabitantTabindex = (group: Group): number => ({ ecos: 20, tycoons: 24, techs: 28 })[group];

const rows = computed(() => productionRows(catalog.value));
for (const row of rows.value) inputs.productivity[String(row.guid)] ??= '100';

// Calculation, like the old "calc": residents from the inhabitant inputs, then demands.
const residents = computed<Residents>(() => {
  const result: Residents = {};
  for (const group of groups) {
    for (let level = 1; level <= levelCount(group); level++) {
      result[`${group}${level}`] = filterNum(inputs.inhabitants[group][level]);
    }
  }
  return result;
});
const demands = computed(() => calculateDemands(catalog.value, residents.value, inputs.info.ecos === '2'));
const demandTexts = computed(
  () => new Map([...demands.value].map(([guid, demand]) => [guid, formatDemand(demand, language.value)])),
);
const productions = computed(
  () =>
    new Map(
      rows.value.map(row => [
        row.guid,
        calculateProduction(row, demands.value.get(row.product) ?? 0, inputs.productivity[String(row.guid)] ?? '100'),
      ]),
    ),
);

// Where the faction lists start: the first item stands on its own, as on the old page.
const groupStarts = { ecos: 1, tycoons: 8, techs: 15 };

/**
 * Splits demands or buildings into the lists of the old page.
 *
 * @param items - The items in demand order.
 * @returns The lists with their faction class.
 */
const chunks = <T,>(items: readonly T[]): { group: string; items: T[] }[] => [
  { group: '', items: items.slice(0, groupStarts.ecos) },
  { group: 'ecos', items: items.slice(groupStarts.ecos, groupStarts.tycoons) },
  { group: 'tycoons', items: items.slice(groupStarts.tycoons, groupStarts.techs) },
  { group: 'techs', items: items.slice(groupStarts.techs) },
];

// --- Production selection and commodity chain -------------------------------------------

const selected = reactive(new Set<number>());
const active = ref<number>();
const chainRequest = ref<ChainRequest>();
const targetVisible = ref(false);
let container = { guid: 0, productivity: 0, count: 0, target: '' };

/**
 * Whether a production building is needed for the current demands.
 *
 * @param guid - The building guid.
 * @returns True if at least one building is needed.
 */
const hasDemand = (guid: number): boolean => (productions.value.get(guid)?.count ?? 0) > 0;

/**
 * The saved settings of a building's chain as part of a chain request.
 *
 * @param guid - The building guid.
 * @param productivity - The productivity of the building.
 * @returns The request parameters.
 */
function savedChainSettings(
  guid: number,
  productivity: number,
): Required<Pick<ChainRequest, 'productivity' | 'preferred'>> {
  const saved = inputs.chains[String(guid)] as ChainSettings | undefined;
  return {
    productivity: { ...saved?.productivity, [guid]: productivity },
    preferred: saved?.preferred ?? [],
  };
}

/**
 * Shows the chain of the only selected building, like the old `updateSelection`. The chain
 * only reloads when building, productivity, count or target changed, as before.
 */
function updateSelection(): void {
  for (const entry of selected) if (!hasDemand(entry)) selected.delete(entry);
  const [guid] = selected;
  const row = rows.value.find(entry => entry.guid === guid);
  const production = productions.value.get(guid);
  if (!row || !production || selected.size !== 1) {
    if (!chainRequest.value) return;
    targetVisible.value = false;
    chainRequest.value = undefined;
    container = { ...container, guid: 0, productivity: 0, count: 0 };
    return;
  }
  const { count } = production;
  const productivity = filterNum(inputs.productivity[String(guid)]);
  const target = inputs.ccTarget;
  const unchanged =
    guid === container.guid &&
    productivity === container.productivity &&
    count === container.count &&
    target === container.target;
  if (unchanged) return;
  container = { guid, productivity, count, target };
  const settings = savedChainSettings(guid, productivity);
  chainRequest.value =
    target === '0'
      ? { pbGuid: guid, tpmNeeded: String(demands.value.get(row.product)), ...settings }
      : { pbGuid: guid, count: String(count), ...settings };
  targetVisible.value = true;
}

/**
 * Keeps what the visitor set in the shown chain.
 *
 * @param settings - The settings of the chain.
 */
function onChainSettings(settings: ChainSettings): void {
  inputs.chains[String(container.guid)] = settings;
}

/**
 * Applies the productivity of the chain's top building to its production field. With the
 * population demand as target, the chain already shows this productivity and does not have
 * to reload. With the maximum production, its target depends on the productivity, so it
 * reloads once the visitor is done, see `updateSelection`.
 *
 * @param text - The productivity in percent.
 */
function onChainRootProductivity(text: string): void {
  inputs.productivity[String(container.guid)] = text;
  if (container.target !== '0') return;
  const count = productions.value.get(container.guid)?.count ?? 0;
  container = { ...container, productivity: filterNum(text), count };
}

/**
 * Selects or deselects a building; Alt, Shift or Ctrl keep other selected buildings.
 *
 * @param guid - The building guid.
 * @param event - The click event.
 */
function onItemClick(guid: number, event: MouseEvent): void {
  if (!hasDemand(guid)) return;
  if (selected.size <= 1 && selected.has(guid)) {
    selected.delete(guid);
    if (active.value === guid) active.value = undefined;
  } else selected.add(guid);
  if (!(event.altKey || event.shiftKey || event.ctrlKey)) {
    for (const other of selected) if (other !== guid) selected.delete(other);
    if (active.value !== guid) active.value = undefined;
  }
  updateSelection();
}

/**
 * Opens a building's productivity slider and selects only that building.
 *
 * @param guid - The building guid.
 */
function activate(guid: number): void {
  if (!hasDemand(guid)) return;
  active.value = guid;
  selected.clear();
  selected.add(guid);
  updateSelection();
}

// --- Houses and residents ---------------------------------------------------------------

const lastValue = reactive<Record<string, string>>({});
const locked = reactive<Record<Group, number | undefined>>({ ecos: undefined, tycoons: undefined, techs: undefined });

/**
 * Writes the sum of a faction's houses into its total field.
 *
 * @param group - The faction.
 */
function summarizeResidences(group: Group): void {
  let total = 0;
  for (let level = 1; level <= levelCount(group); level++) total += filterNum(inputs.residences[group][level]);
  inputs.residences[group][0] = String(total);
}

/**
 * Writes the residents' totals and updates the calculation, like the old `summarize`.
 */
function summarizeInhabitants(): void {
  for (const group of groups) {
    let total = 0;
    for (let level = 1; level <= levelCount(group); level++) total += filterNum(inputs.inhabitants[group][level]);
    inputs.inhabitants[group][0] = String(total);
  }
  updateSelection();
}

/**
 * Calculates the residents of all factions from their houses.
 */
function updateByResidences(): void {
  for (const group of groups) {
    const houses = inputs.residences[group].slice(1).map(value => filterNum(value));
    const values = residentsFromHouses(group, houses, inputs.info[group] === '1');
    for (const [index, value] of values.entries()) inputs.inhabitants[group][index + 1] = String(value);
  }
  summarizeInhabitants();
}

/**
 * Distributes a faction's total houses over its levels.
 *
 * @param group - The faction.
 */
function distribute(group: Group): void {
  const total = filterNum(inputs.residences[group][0]);
  const values = distributeResidences(group, total, filterNum(inputs.maxUpgrade[group]));
  for (const [index, value] of values.entries()) inputs.residences[group][index + 1] = String(value);
  updateByResidences();
}

/**
 * Reacts to a changed house field: a total is distributed, a level is summed up.
 *
 * @param group - The faction.
 * @param level - 0 for the total, otherwise the level.
 */
function onResidenceChange(group: Group, level: number): void {
  if (level === 0) distribute(group);
  else {
    summarizeResidences(group);
    updateByResidences();
  }
}

/**
 * A number input of the calculator with its change handler.
 */
interface NumberField {
  list: string[];
  index: number;
  key: string;
  change: () => void;
}

const residenceField = (group: Group, level: number): NumberField => ({
  list: inputs.residences[group],
  index: level,
  key: `${group}${level}r`,
  change: () => {
    onResidenceChange(group, level);
  },
});

const inhabitantField = (group: Group, level: number): NumberField => ({
  list: inputs.inhabitants[group],
  index: level,
  key: `${group}${level}i`,
  change: summarizeInhabitants,
});

/**
 * Remembers the text before a key changes it, like the old keydown handler.
 *
 * @param field - The number input.
 */
function onNumberKeyDown(field: NumberField): void {
  const value = field.list[field.index] ?? '';
  lastValue[field.key] = value === '' ? '-1' : value;
}

/**
 * Keeps only digits and reacts as soon as the number changed, like the old keyup handler.
 *
 * @param field - The number input.
 */
function onNumberKeyUp(field: NumberField): void {
  const digits = (field.list[field.index] ?? '').replaceAll(/[^0-9]/g, '');
  const value = digits === '' ? '' : String(Number(digits));
  if (field.list[field.index] !== value) field.list[field.index] = value;
  if (filterNum(lastValue[field.key]) !== filterNum(value)) field.change();
}

/**
 * Normalizes the number when leaving the input, like the old blur handler.
 *
 * @param field - The number input.
 */
function onNumberBlur(field: NumberField): void {
  field.list[field.index] = String(filterNum(field.list[field.index]));
  field.change();
}

/**
 * Applies a new highest level and redistributes the houses.
 *
 * @param group - The faction.
 * @param value - The highest allowed level.
 */
function onUpgradeSlide(group: Group, value: number): void {
  inputs.maxUpgrade[group] = String(value);
  locked[group] = value;
  distribute(group);
}

/**
 * Switches an information channel of a faction on or off.
 *
 * @param group - The faction.
 * @param value - The channel, "1" or "2".
 */
function toggleInfo(group: Group, value: string): void {
  inputs.info[group] = inputs.info[group] === value ? '0' : value;
  updateByResidences();
}

/**
 * Resets the inputs like the old reset: the sliders move to the top, but their hidden
 * fields keep their value.
 */
function reset(): void {
  for (const row of rows.value) inputs.productivity[String(row.guid)] = '100';
  inputs.chains = {};
  for (const group of groups) {
    inputs.upgradeSlider[group] = Math.min(RESET_UPGRADE, levelCount(group));
    inputs.residences[group] = inputs.residences[group].map(() => '0');
    inputs.info[group] = '0';
  }
  distribute('techs');
}

const isLocked = (group: Group, level: number): boolean => locked[group] !== undefined && level > locked[group];

// --- Box visibility ---------------------------------------------------------------------

const boxes = ['residences', 'inhabitants', 'demands', 'production'] as const;
const boxTitles: Record<(typeof boxes)[number], string> = {
  residences: 'Wohnhäuser anzeigen',
  inhabitants: 'Einwohner anzeigen',
  demands: 'Bedürfnisse anzeigen',
  production: 'Produktionsbetriebe anzeigen',
};

/**
 * Shows or hides a box. Hiding the production buildings also hides the chain.
 *
 * @param box - The box.
 */
function toggleBox(box: (typeof boxes)[number]): void {
  inputs.show[box] = !inputs.show[box];
  if (box !== 'production' || inputs.show.production) return;
  selected.clear();
  active.value = undefined;
  updateSelection();
}

// --- Productivity inputs ----------------------------------------------------------------

/**
 * Applies a typed productivity, clamped to 1 to 999 percent.
 *
 * @param guid - The building guid.
 * @param event - The input event.
 */
function onProductivityInput(guid: number, event: Event): void {
  const input = event.target as HTMLInputElement;
  const value = Math.max(1, Math.min(MAX_PRODUCTIVITY, filterNum(input.value)));
  input.value = String(value);
  inputs.productivity[String(guid)] = String(value);
}

/**
 * Applies the productivity as soon as its text changed.
 *
 * @param guid - The building guid.
 * @param event - The keyboard event.
 */
function onProductivityKeyUp(guid: number, event: KeyboardEvent): void {
  const input = event.target as HTMLInputElement;
  if (input.value !== '' && lastValue[`productivity_${guid}`] !== input.value) onProductivityInput(guid, event);
}

/**
 * Applies a productivity from the slider.
 *
 * @param guid - The building guid.
 * @param value - The productivity in percent.
 */
function onProductivitySlide(guid: number, value: number): void {
  inputs.productivity[String(guid)] = String(value);
}

const productionList = ref<HTMLElement>();

/**
 * Hides the open slider when the visitor clicks outside its focused input.
 */
function onWindowClick(): void {
  if (active.value === undefined) return;
  const focused = productionList.value?.querySelector(':scope li.active .productivity :focus');
  if (!focused) active.value = undefined;
}
onMounted(() => {
  globalThis.addEventListener('click', onWindowClick);
});
onBeforeUnmount(() => {
  globalThis.removeEventListener('click', onWindowClick);
});

/**
 * Marks the total inputs as read-only. The old styles select `[readonly=readonly]`, but
 * Vue.js writes boolean attributes as empty.
 *
 * @param element - The input element.
 */
const markReadonly = (element: unknown): void => {
  (element as HTMLInputElement | null)?.setAttribute('readonly', 'readonly');
};

const productIcon = (guid: number): string => catalog.value.products.get(guid)?.icon ?? '';
const productName = (guid: number): string => catalog.value.products.get(guid)?.name ?? '';
const building = (guid: number): { icon: string; name: string } =>
  catalog.value.productionBuildings.get(guid) ?? { icon: '', name: '' };

const ccTargetOptions = computed(() => [
  { value: '0', label: t('Bevölkerungsbedarf') },
  { value: '1', label: t('max. Produktion des Endprodukts') },
]);
</script>

<template>
  <h2 class="population">{{ t('Bevölkerung') }}</h2>
  <form id="population-form" method="post" @submit.prevent>
    <Transition name="fade">
      <fieldset v-show="inputs.show.residences" id="residences-fieldset" class="blue">
        <legend>{{ t('Wohnhäuser') }}</legend>
        <dl v-for="group in groups" :key="group" :class="group">
          <dt :class="`${group}0`">
            <label>{{ t('insgesamt') }}</label>
          </dt>
          <dd :class="`${group}0`">
            <input
              v-model="inputs.residences[group][0]"
              type="text"
              :name="`${group}0r`"
              autocomplete="off"
              :tabindex="residenceTabindex(group)"
              @keydown="onNumberKeyDown(residenceField(group, 0))"
              @keyup="onNumberKeyUp(residenceField(group, 0))"
              @blur="onNumberBlur(residenceField(group, 0))"
              @change="onResidenceChange(group, 0)"
            />
            <UiSlider
              v-model="inputs.upgradeSlider[group]"
              class="slider"
              :data-tabindex="residenceTabindex(group) + 1"
              :tabindex="residenceTabindex(group) + 1"
              :min="1"
              :max="levelCount(group)"
              @slide="onUpgradeSlide(group, $event)"
              @handle-focus="locked[group] = filterNum(inputs.maxUpgrade[group])"
              @handle-blur="locked[group] = undefined"
            />
            <input type="hidden" :name="`${group}_max_upgrade`" :value="inputs.maxUpgrade[group]" />
          </dd>
          <template v-for="level in levelCount(group)" :key="level">
            <dt :class="[`${group}${level}`, { locked: isLocked(group, level) }]">
              <label>{{ t(levelNames[group][level - 1]!) }}</label>
            </dt>
            <dd :class="[`${group}${level}`, { locked: isLocked(group, level) }]">
              <input
                v-model="inputs.residences[group][level]"
                type="text"
                :name="`${group}${level}r`"
                :data-value="inputs.residences[group][level]"
                autocomplete="off"
                :tabindex="residenceTabindex(group) + 1 + level"
                @keydown="onNumberKeyDown(residenceField(group, level))"
                @keyup="onNumberKeyUp(residenceField(group, level))"
                @blur="onNumberBlur(residenceField(group, level))"
                @change="onResidenceChange(group, level)"
              />
            </dd>
          </template>
          <dt :class="`${group}_info`">
            <label>{{ t('Information') }}</label>
          </dt>
          <dd :class="`${group}_info info_channel`">
            <a
              :id="`${group}_info_1`"
              href="#"
              :class="{ active: inputs.info[group] === '1' }"
              data-value="1"
              :title="`+12% ${t('Wohnraum')}`"
              @click.prevent="toggleInfo(group, '1')"
            ></a>
            <a
              v-if="group === 'ecos'"
              :id="`${group}_info_2`"
              href="#"
              :class="{ active: inputs.info[group] === '2' }"
              data-value="2"
              :title="`-15% ${t('Bedarf nach Lifestyleprodukten')}`"
              @click.prevent="toggleInfo(group, '2')"
            ></a>
            <input
              type="hidden"
              :name="`${group}_info`"
              :value="inputs.info[group]"
              :tabindex="residenceTabindex(group) + 2 + levelCount(group)"
            />
          </dd>
        </dl>
        <a href="#" class="display-hide" @click.prevent="toggleBox('residences')"></a>
        <input type="button" class="reset" :value="t('Zurücksetzen')" @click="reset" />
        <div class="clear"></div>
      </fieldset>
    </Transition>
    <Transition name="fade">
      <fieldset v-show="inputs.show.inhabitants" id="inhabitants-fieldset" class="blue">
        <legend>{{ t('Einwohner') }}</legend>
        <dl v-for="group in groups" :key="group" :class="group">
          <template v-for="level in levelCount(group)" :key="level">
            <dt :class="`${group}${level}`">
              <label>{{ t(levelNames[group][level - 1]!) }}</label>
            </dt>
            <dd :class="`${group}${level}`">
              <input
                v-model="inputs.inhabitants[group][level]"
                type="text"
                :name="`${group}${level}i`"
                :data-value="inputs.inhabitants[group][level]"
                autocomplete="off"
                :tabindex="inhabitantTabindex(group) + level - 1"
                @keydown="onNumberKeyDown(inhabitantField(group, level))"
                @keyup="onNumberKeyUp(inhabitantField(group, level))"
                @blur="onNumberBlur(inhabitantField(group, level))"
                @change="summarizeInhabitants"
              />
            </dd>
          </template>
          <dt :class="`${group}0`">
            <label>{{ t('insgesamt') }}</label>
          </dt>
          <dd :class="`${group}0`">
            <input type="text" :name="`${group}0i`" :ref="markReadonly" :value="inputs.inhabitants[group][0]" />
          </dd>
        </dl>
        <a href="#" class="display-hide" @click.prevent="toggleBox('inhabitants')"></a>
        <input type="button" class="reset" :value="t('Zurücksetzen')" @click="reset" />
        <div class="clear"></div>
      </fieldset>
    </Transition>
    <Transition name="fade">
      <fieldset v-show="inputs.show.demands" id="demands-fieldset" class="blue">
        <legend>
          {{ t('Bedürfnisse') }}<span>({{ t('Tonnen pro Minute') }})</span>
        </legend>
        <ol v-for="chunk in chunks(catalog.demands)" :key="chunk.group" :class="chunk.group || undefined">
          <li
            v-for="demand in chunk.items"
            :key="demand.product"
            :class="{ 'no-demand': demandTexts.get(demand.product) === '0' }"
            :data-guid="demand.product"
          >
            <span class="icon-32"
              ><span
                :style="`background-image:url('/img/icons/32/${productIcon(demand.product)}')`"
                :title="productName(demand.product)"
              ></span
            ></span>
            <span class="count">{{ demandTexts.get(demand.product) }}</span>
          </li>
        </ol>
        <a href="#" class="display-hide" @click.prevent="toggleBox('demands')"></a>
        <div class="clear"></div>
      </fieldset>
    </Transition>
    <Transition name="fade">
      <fieldset v-show="inputs.show.production" id="production-fieldset" ref="productionList" class="blue">
        <legend>{{ t('Produktionsgebäude') }}</legend>
        <ol v-for="chunk in chunks(rows)" :key="chunk.group" :class="chunk.group || undefined">
          <li
            v-for="row in chunk.items"
            :key="row.guid"
            :class="{
              'no-demand': !hasDemand(row.guid),
              selected: selected.has(row.guid),
              active: active === row.guid,
            }"
            :data-guid="row.guid"
            :data-product-guid="row.product"
            @click="onItemClick(row.guid, $event)"
          >
            <span
              class="productivity"
              :title="t('max. Produktivität')"
              @click.stop="($event.currentTarget as HTMLElement).querySelector('input')?.focus()"
              @focusin="activate(row.guid)"
            >
              <input
                type="text"
                :name="`productivity_${row.guid}`"
                :value="inputs.productivity[String(row.guid)]"
                @keydown="lastValue[`productivity_${row.guid}`] = ($event.target as HTMLInputElement).value"
                @keyup="onProductivityKeyUp(row.guid, $event)"
                @change="onProductivityInput(row.guid, $event)"
                @blur="updateSelection"
              /><span class="percent">%</span>
              <div class="slider-container hide">
                <UiSlider
                  :model-value="filterNum(inputs.productivity[String(row.guid)])"
                  class="slider"
                  :min="50"
                  :max="300"
                  @start="activate(row.guid)"
                  @slide="onProductivitySlide(row.guid, $event)"
                  @stop="updateSelection"
                />
              </div>
            </span>
            <span class="icon-32"
              ><span
                :style="`background-image:url('/img/icons/32/${building(row.guid).icon}')`"
                :title="building(row.guid).name"
              ></span
            ></span>
            <span class="count" :title="t('Anzahl der Produktionsgebäude')"
              >×<span>{{ productions.get(row.guid)?.count }}</span></span
            >
            <span :class="`efficiency ${productions.get(row.guid)?.efficiencyClass}`" :title="t('Effizienz')"
              >{{ productions.get(row.guid)?.percent }}%</span
            >
          </li>
        </ol>
        <a href="#" class="display-hide" @click.prevent="toggleBox('production')"></a>
        <div class="clear"></div>
      </fieldset>
    </Transition>
    <fieldset id="hidden-fieldset">
      <input
        v-for="box in boxes"
        :key="box"
        type="hidden"
        :name="`show_${box}`"
        :value="inputs.show[box] ? '1' : '0'"
      />
    </fieldset>
    <Transition name="fade">
      <div v-show="targetVisible" id="commodity-chain-target">
        <dl>
          <dt>
            <label>{{ t('Soll TPM der Produktionskette:') }}</label>
          </dt>
          <dd>
            <UiSelectMenu
              v-model="inputs.ccTarget"
              :options="ccTargetOptions"
              name="cc_target"
              select-class="full"
              @select="updateSelection"
            />
          </dd>
        </dl>
      </div>
    </Transition>
  </form>
  <div id="commodity-chain-container">
    <Transition name="fade">
      <CommodityChain
        v-if="chainRequest"
        :catalog="catalog"
        :request="chainRequest"
        @settings="onChainSettings"
        @root-productivity="onChainRootProductivity"
        @root-settled="updateSelection"
      />
    </Transition>
  </div>
  <ul id="display-options">
    <li v-for="box in boxes" :key="box">
      <a
        href="#"
        :class="[`show_${box}`, { active: inputs.show[box] }]"
        :title="t(boxTitles[box])"
        @click.prevent="toggleBox(box)"
      ></a>
    </li>
  </ul>
</template>
