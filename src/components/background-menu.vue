<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { useI18n } from '../i18n';
import {
  backgroundClass,
  backgrounds,
  backgroundUrl,
  type Background,
  type BackgroundChoice,
} from '../models/background';
import { useBackgroundStore } from '../stores/background';

/**
 * The picture icon in the header and its list of backgrounds. Pointing at an entry or moving
 * to it with the arrow keys previews it; only a click or Enter saves it.
 */
const store = useBackgroundStore();
const { t } = useI18n();
const { clearTimeout, document, Image, setTimeout } = globalThis;

/**
 * Time in milliseconds an entry has to stay pointed at before its image is loaded, so
 * passing over the list does not load every image.
 */
const PREVIEW_DELAY = 150;

const imageLabels: Record<Background, string> = {
  eco1: 'Ecos 1',
  eco2: 'Ecos 2',
  eco3: 'Ecos 3',
  eco4: 'Ecos 4',
  eco5: 'Ecos 5',
  tycoon1: 'Tycoons 1',
  tycoon2: 'Tycoons 2',
};

const choices: readonly BackgroundChoice[] = ['random', ...backgrounds];

const label = (choice: BackgroundChoice): string =>
  choice === 'random' ? t('Zufällig (wechselt täglich)') : imageLabels[choice];

const root = ref<HTMLElement>();
const isOpen = ref(false);
const cursor = ref(-1);
const savedIndex = computed(() => choices.indexOf(store.choice));

// The router replaces the page class of the body and leaves this class alone.
watch(
  () => store.shown,
  shown => {
    document.body.classList.remove(...backgrounds.map(background => backgroundClass(background)));
    document.body.classList.add(backgroundClass(shown));
  },
  { immediate: true },
);

let timer: ReturnType<typeof setTimeout> | undefined;
let pending: BackgroundChoice | undefined;

/**
 * Shows an entry as soon as its image has loaded, so the page never goes black in between.
 *
 * @param choice - The entry.
 */
function startPreview(choice: BackgroundChoice): void {
  clearTimeout(timer);
  pending = choice;
  timer = setTimeout(() => {
    const image = new Image();
    image.addEventListener('load', () => {
      if (pending === choice) store.preview = choice;
    });
    image.src = backgroundUrl(store.imageOf(choice));
  }, PREVIEW_DELAY);
}

/**
 * Returns to the saved choice.
 */
function endPreview(): void {
  clearTimeout(timer);
  pending = undefined;
  store.preview = undefined;
}

/**
 * Closes the list and shows the saved choice.
 */
function close(): void {
  isOpen.value = false;
  cursor.value = -1;
  endPreview();
}

/**
 * Saves an entry and closes the list.
 *
 * @param choice - The entry.
 */
function save(choice: BackgroundChoice): void {
  store.choice = choice;
  close();
}

/**
 * Marks an entry and previews it.
 *
 * @param index - The position of the entry.
 */
function point(index: number): void {
  cursor.value = index;
  startPreview(choices[index]);
}

/**
 * Stops pointing at the entries.
 */
function leave(): void {
  cursor.value = -1;
  endPreview();
}

/**
 * Opens or closes the list.
 */
function toggle(): void {
  if (isOpen.value) close();
  else isOpen.value = true;
}

/**
 * Handles the keyboard while the list is open.
 *
 * @param event - The keyboard event.
 */
function onKeyDown(event: KeyboardEvent): void {
  if (!isOpen.value) return;
  const start = cursor.value < 0 ? savedIndex.value : cursor.value;
  switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault();
      point(Math.min(choices.length - 1, start + 1));
      break;
    }
    case 'ArrowUp': {
      event.preventDefault();
      point(Math.max(0, start - 1));
      break;
    }
    case 'Enter': {
      event.preventDefault();
      if (cursor.value >= 0) save(choices[cursor.value]);
      else close();
      break;
    }
    case 'Escape':
    case 'Tab': {
      close();
      break;
    }
    default:
  }
}

/**
 * Closes the list when the visitor clicks elsewhere.
 *
 * @param event - The click event.
 */
function onWindowClick(event: MouseEvent): void {
  if (isOpen.value && !root.value?.contains(event.target as Node)) close();
}
onMounted(() => {
  globalThis.addEventListener('click', onWindowClick);
});
onBeforeUnmount(() => {
  globalThis.removeEventListener('click', onWindowClick);
  clearTimeout(timer);
});
</script>

<template>
  <div id="background-chooser" ref="root">
    <ul id="user-menu">
      <li class="background">
        <a
          href="#"
          :title="t('Hintergrund')"
          :aria-label="t('Hintergrund')"
          aria-haspopup="listbox"
          :aria-expanded="isOpen"
          @click.prevent="toggle"
          @keydown="onKeyDown"
        ></a>
      </li>
    </ul>
    <div v-if="isOpen" id="background-menu" class="ui-selectmenu-menu ui-selectmenu-open">
      <ul role="listbox" @mouseleave="leave">
        <li
          v-for="(choice, index) in choices"
          :key="choice"
          role="option"
          :aria-selected="index === savedIndex"
          :class="{ 'ui-selectmenu-item-selected': index === savedIndex, 'ui-state-hover': index === cursor }"
          @mouseenter="point(index)"
        >
          <a href="#" tabindex="-1" @click.prevent="save(choice)">{{ label(choice) }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>
