<script setup lang="ts" generic="T extends AutocompleteItem">
import { onBeforeUnmount, ref, shallowRef } from 'vue';

/**
 * A text input with suggestions that renders and behaves like the jQuery UI 1.8
 * autocomplete of the old site: suggestions appear after a short delay, arrow keys move
 * through them and fill the input, Enter or a click chooses one.
 */
export interface AutocompleteItem {
  label: string;
  value: string;
}

const props = withDefaults(defineProps<{ source: (term: string) => T[]; delay?: number; minLength?: number }>(), {
  delay: 300,
  minLength: 1,
});

const value = defineModel<string>({ required: true });

const emit = defineEmits<{ select: [item: T] }>();

defineOptions({ inheritAttrs: false });

/**
 * Suggestions close this long after the input loses focus, in milliseconds.
 */
const CLOSE_DELAY = 150;

const input = ref<HTMLInputElement>();
const items = shallowRef<T[]>([]);
const visible = ref(false);
const activeIndex = ref(-1);
const position = ref({ top: 0, left: 0, width: 0, zIndex: 1 });

let term = '';
let searchTimer: ReturnType<typeof globalThis.setTimeout> | undefined;
let closeTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

onBeforeUnmount(() => {
  globalThis.clearTimeout(searchTimer);
  globalThis.clearTimeout(closeTimer);
});

/**
 * Hides the suggestions.
 */
function close(): void {
  globalThis.clearTimeout(searchTimer);
  visible.value = false;
  activeIndex.value = -1;
}

/**
 * Shows the suggestions for the current text below the input.
 */
function search(): void {
  term = value.value;
  const results = term.length < props.minLength ? [] : props.source(term);
  if (results.length === 0 || !input.value) {
    close();
    return;
  }
  items.value = results;
  activeIndex.value = -1;
  const box = input.value.getBoundingClientRect();
  position.value = {
    top: box.bottom + globalThis.scrollY,
    left: box.left + globalThis.scrollX,
    width: input.value.offsetWidth,
    zIndex: 1,
  };
  visible.value = true;
}

/**
 * Marks a suggestion. Moving with the keyboard writes it into the input, like jQuery UI.
 *
 * @param index - The suggestion index.
 * @param byKeyboard - Whether the keyboard moved there.
 */
function activate(index: number, byKeyboard: boolean): void {
  activeIndex.value = index;
  const item = items.value.at(index);
  if (byKeyboard && item) value.value = item.value;
}

/**
 * Moves through the suggestions. Moving past either end returns to the typed text.
 *
 * @param direction - 1 for down, -1 for up.
 */
function move(direction: 1 | -1): void {
  if (!visible.value) {
    search();
    return;
  }
  const last = items.value.length - 1;
  const atEnd = direction < 0 ? activeIndex.value === 0 : activeIndex.value === last;
  if (atEnd) {
    value.value = term;
    activeIndex.value = -1;
    return;
  }
  const start = direction > 0 ? 0 : last;
  activate(activeIndex.value < 0 ? start : activeIndex.value + direction, true);
}

/**
 * Chooses a suggestion and reports it.
 *
 * @param index - The suggestion index.
 */
function choose(index: number): void {
  const item = index >= 0 ? items.value.at(index) : undefined;
  if (!item) return;
  value.value = item.value;
  close();
  input.value?.focus();
  emit('select', item);
}

// Keys with a meaning while suggestions may be shown; other keys start a search.
const keys = new Map<string, (event: KeyboardEvent) => void>([
  [
    'ArrowUp',
    event => {
      event.preventDefault();
      move(-1);
    },
  ],
  [
    'ArrowDown',
    event => {
      event.preventDefault();
      move(1);
    },
  ],
  [
    'PageUp',
    event => {
      if (!visible.value) return;
      event.preventDefault();
      activate(0, true);
    },
  ],
  [
    'PageDown',
    event => {
      if (!visible.value) return;
      event.preventDefault();
      activate(items.value.length - 1, true);
    },
  ],
  [
    'Enter',
    event => {
      // An active suggestion is chosen instead of submitting the form.
      if (!visible.value || activeIndex.value < 0) return;
      event.preventDefault();
      choose(activeIndex.value);
    },
  ],
  [
    'Tab',
    () => {
      if (visible.value) choose(activeIndex.value);
    },
  ],
  [
    'Escape',
    () => {
      if (!visible.value) return;
      value.value = term;
      close();
    },
  ],
]);

/**
 * Handles keys in the input.
 *
 * @param event - The keyboard event.
 */
function onKeyDown(event: KeyboardEvent): void {
  const action = keys.get(event.key);
  if (action) {
    action(event);
    return;
  }
  globalThis.clearTimeout(searchTimer);
  searchTimer = globalThis.setTimeout(() => {
    if (value.value !== term) search();
  }, props.delay);
}

/**
 * Closes the suggestions shortly after leaving the input.
 */
function onBlur(): void {
  globalThis.clearTimeout(searchTimer);
  closeTimer = globalThis.setTimeout(close, CLOSE_DELAY);
}

/**
 * Keeps the input focused while clicking a suggestion.
 *
 * @param event - The mouse event.
 */
function onMenuMouseDown(event: MouseEvent): void {
  event.preventDefault();
  globalThis.clearTimeout(closeTimer);
}

defineExpose({ close, input });
</script>

<template>
  <input
    ref="input"
    v-model="value"
    type="text"
    v-bind="$attrs"
    class="ui-autocomplete-input"
    autocomplete="off"
    role="textbox"
    aria-autocomplete="list"
    aria-haspopup="true"
    @keydown="onKeyDown"
    @blur="onBlur"
  />
  <Teleport to="body">
    <ul
      class="ui-autocomplete ui-menu ui-widget ui-widget-content ui-corner-all"
      role="listbox"
      aria-activedescendant="ui-active-menuitem"
      :style="{
        // jQuery placed the menu with offset(), which made it position: relative; absolute looks the same.
        position: 'absolute',
        zIndex: position.zIndex,
        top: `${position.top}px`,
        left: `${position.left}px`,
        display: visible ? 'block' : 'none',
        width: `${position.width}px`,
      }"
      @mousedown="onMenuMouseDown"
    >
      <li v-for="(item, index) in items" :key="`${index}-${item.label}`" class="ui-menu-item" role="menuitem">
        <a
          :id="index === activeIndex ? 'ui-active-menuitem' : undefined"
          class="ui-corner-all"
          tabindex="-1"
          :class="{ 'ui-state-hover': index === activeIndex }"
          @mouseenter="activate(index, false)"
          @mouseleave="activeIndex = -1"
          @click.prevent="choose(index)"
          >{{ item.label }}</a
        >
      </li>
    </ul>
  </Teleport>
</template>
