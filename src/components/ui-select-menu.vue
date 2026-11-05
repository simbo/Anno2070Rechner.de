<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue';

import type { SelectOption } from './select-option';

/**
 * A select box that renders and behaves like the jQuery UI selectmenu 1.2 plugin of the
 * old site in "popup" style: the open list is placed so the selected entry lies over the
 * button. The native select stays in the markup, hidden, as before.
 */
const props = withDefaults(
  defineProps<{ options: readonly SelectOption[]; name: string; tabindex?: number | string; selectClass?: string }>(),
  {
    tabindex: 0,
    selectClass: '',
  },
);

const value = defineModel<string>({ required: true });

const emit = defineEmits<{
  /**
   * An entry was chosen, also when it was already selected.
   */
  select: [value: string];
}>();

const { document, getComputedStyle } = globalThis;

/**
 * The open list is at most a third of the window high.
 */
const WINDOW_SHARE = 3;

/**
 * The release of the opening click is ignored for this long, in milliseconds.
 */
const SAFE_MOUSE_UP_DELAY = 300;

/**
 * Typed characters are combined for this long, in milliseconds.
 */
const TYPE_AHEAD_DELAY = 1000;

const id = `ui-selectmenu-${useId()}`;
const select = ref<HTMLSelectElement>();
const button = ref<HTMLAnchorElement>();
const list = ref<HTMLUListElement>();
const wrap = ref<HTMLDivElement>();
const width = ref<number>();
const listHeight = ref<number>();
const isOpen = ref(false);
const buttonHover = ref(false);
const focusIndex = ref(-1);
const position = ref({ top: 0, left: 0, zIndex: 1 });
const measured = ref(false);

const selectedIndex = computed(() =>
  Math.max(
    0,
    props.options.findIndex(option => option.value === value.value),
  ),
);
const selectedLabel = computed(() => props.options.at(selectedIndex.value)?.label ?? '');

/**
 * The z-index like jQuery UI's `zIndex()`: the first positioned ancestor with one.
 *
 * @param element - The start element.
 * @returns The z-index, or 0.
 */
function inheritedZindex(element: HTMLElement | null): number {
  for (let node = element; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    const z = Number(style.zIndex);
    if (z !== 0 && !Number.isNaN(z) && ['absolute', 'relative', 'fixed'].includes(style.position)) return z;
  }
  return 0;
}

/**
 * Pixels of a computed CSS length such as `12px`, or 0 for other values.
 *
 * @param length - The computed length.
 * @returns The pixels.
 */
const cssPixels = (length: string): number => Number(/^-?[\d.]+(?=px$)/.exec(length)?.[0] ?? 0);

/**
 * The outer width like jQuery 1.7's `outerWidth()`: inside hidden containers it falls back
 * to the CSS width plus padding and border.
 *
 * @param element - The element.
 * @returns The width in pixels.
 */
function outerWidth(element: HTMLElement): number {
  if (element.offsetWidth > 0) return element.offsetWidth;
  const style = getComputedStyle(element);
  return [style.width, style.paddingLeft, style.paddingRight, style.borderLeftWidth, style.borderRightWidth].reduce(
    (total, length) => total + cssPixels(length),
    0,
  );
}

/**
 * Limits the list height like the plugin: lists taller than a third of the window scroll.
 * The list is hidden while closed, so it is measured like jQuery measures hidden elements.
 *
 * @param element - The list wrapper.
 */
function limitHeight(element: HTMLElement): void {
  const { style } = element;
  style.display = 'block';
  style.visibility = 'hidden';
  const height = element.offsetHeight;
  style.display = '';
  style.visibility = '';
  const limit = globalThis.innerHeight / WINDOW_SHARE;
  if (limit < height) listHeight.value = limit;
}

/**
 * The link of an entry in the open list.
 *
 * @param index - The entry index.
 * @returns The link, if rendered.
 */
const linkAt = (index: number): HTMLAnchorElement | undefined =>
  list.value?.querySelectorAll<HTMLAnchorElement>(':scope > li > a')[index];

/**
 * The list item of an entry.
 *
 * @param index - The entry index.
 * @returns The item, if rendered.
 */
const itemAt = (index: number): HTMLElement | undefined => list.value?.children[index] as HTMLElement | undefined;

/**
 * Places the open list so that the selected entry lies over the button, like the plugin's
 * popup style. jQuery UI's `position()` aligns the border box, so margins are subtracted.
 */
function refreshPosition(): void {
  if (!list.value || !button.value || !wrap.value || !select.value) return;
  const buttonBox = button.value.getBoundingClientRect();
  const listBox = list.value.getBoundingClientRect();
  const selectedBox = itemAt(selectedIndex.value)?.getBoundingClientRect() ?? listBox;
  const offset = listBox.top - selectedBox.top - (buttonBox.height + selectedBox.height) / 2;
  const margins = getComputedStyle(wrap.value);
  position.value = {
    top: buttonBox.bottom + globalThis.scrollY + offset - cssPixels(margins.marginTop),
    left: buttonBox.left + globalThis.scrollX - cssPixels(margins.marginLeft),
    zIndex: inheritedZindex(select.value) + 1,
  };
}

/**
 * Opens the list with the selected entry centered and focused. Other lists close.
 */
async function open(): Promise<void> {
  document.dispatchEvent(new CustomEvent('ui-selectmenu-open', { detail: id }));
  isOpen.value = true;
  focusIndex.value = selectedIndex.value;
  await nextTick();
  const selected = itemAt(selectedIndex.value);
  if (selected && list.value) {
    list.value.scrollTop += selected.offsetTop - list.value.offsetHeight / 2 + selected.offsetHeight / 2;
  }
  refreshPosition();
  linkAt(selectedIndex.value)?.focus();
}

/**
 * Closes the list.
 *
 * @param retainFocus - Whether the button gets the focus back.
 */
function close(retainFocus: boolean): void {
  if (!isOpen.value) return;
  isOpen.value = false;
  focusIndex.value = -1;
  if (retainFocus) button.value?.focus();
}

/**
 * Opens a closed list or closes an open one.
 *
 * @param retainFocus - Whether the button gets the focus back when closing.
 */
function toggle(retainFocus: boolean): void {
  if (isOpen.value) close(retainFocus);
  else void open();
}

/**
 * Chooses an entry: sets the value, reports the choice and closes the list.
 *
 * @param index - The entry index.
 */
function choose(index: number): void {
  const option = index >= 0 ? props.options.at(index) : undefined;
  if (!option) return;
  value.value = option.value;
  emit('select', option.value);
  close(true);
}

let safeMouseUp = true;
let safeTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

/**
 * Toggles the list. The release of this click must not choose an entry right away.
 *
 * @param event - The mouse event.
 */
function onButtonMouseDown(event: MouseEvent): void {
  event.preventDefault();
  event.stopPropagation();
  toggle(true);
  safeMouseUp = false;
  globalThis.clearTimeout(safeTimer);
  safeTimer = globalThis.setTimeout(() => (safeMouseUp = true), SAFE_MOUSE_UP_DELAY);
}

/**
 * Chooses the entry next to the selected one.
 *
 * @param amount - Steps to move, negative to move up.
 */
function moveSelection(amount: number): void {
  choose(Math.min(props.options.length - 1, Math.max(0, selectedIndex.value + amount)));
}

/**
 * Focuses an entry of the open list.
 *
 * @param target - The entry index, clamped to the list.
 */
function moveFocus(target: number): void {
  const next = Math.min(props.options.length - 1, Math.max(0, target));
  focusIndex.value = next;
  linkAt(next)?.focus();
}

let typed = '';
let typedCycling = false;
let typedTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

/**
 * Finds an entry by typed characters like the plugin: repeating one character cycles
 * through entries starting with it, otherwise the whole typed text must match and the
 * last match wins.
 *
 * @param key - The typed character.
 * @param fromIndex - The index to continue from.
 * @returns The matching index, or undefined.
 */
function typeAhead(key: string, fromIndex: number): number | undefined {
  globalThis.clearTimeout(typedTimer);
  const character = key.toLowerCase();
  typed += character;
  typedCycling = typed.length < 2 || (typedCycling && typed.slice(0, -1).at(-1) === character);
  const match = typedCycling ? character : typed;
  let next: number | undefined;
  for (const [index, option] of props.options.entries()) {
    if (option.label.slice(0, match.length).toLowerCase() !== match) continue;
    const cycleTarget = next === undefined || (index > fromIndex && next <= fromIndex);
    if (!typedCycling || cycleTarget) next = index;
  }
  typedTimer = globalThis.setTimeout(() => {
    typed = '';
    typedCycling = false;
  }, TYPE_AHEAD_DELAY);
  return next;
}

// Keys on the closed button, like the plugin: arrows change the selection directly.
const buttonKeys = new Map<string, (event: KeyboardEvent) => void>([
  [
    ' ',
    () => {
      toggle(false);
    },
  ],
  [
    'ArrowUp',
    event => {
      if (event.altKey) void open();
      else moveSelection(-1);
    },
  ],
  [
    'ArrowDown',
    event => {
      if (event.altKey) void open();
      else moveSelection(1);
    },
  ],
  [
    'ArrowLeft',
    () => {
      moveSelection(-1);
    },
  ],
  [
    'ArrowRight',
    () => {
      moveSelection(1);
    },
  ],
  ['Home', () => (value.value = props.options.at(0)?.value ?? '')],
]);

/**
 * Handles keys on the button.
 *
 * @param event - The keyboard event.
 */
function onButtonKeyDown(event: KeyboardEvent): void {
  const action = buttonKeys.get(event.key);
  if (action) {
    event.preventDefault();
    action(event);
    return;
  }
  if (event.key.length !== 1) return;
  const index = typeAhead(event.key, selectedIndex.value);
  if (index !== undefined) choose(index);
}

/**
 * Entries per page of the open list.
 *
 * @returns The number of entries.
 */
function perPage(): number {
  const first = list.value?.firstElementChild as HTMLElement | null | undefined;
  return Math.floor((list.value?.offsetHeight ?? 0) / (first?.offsetHeight ?? 1));
}

// Keys in the open list, like the plugin: arrows move the focus, Enter and Space choose.
const listKeys = new Map<string, (current: number, event: KeyboardEvent) => void>([
  [
    'ArrowUp',
    (current, event) => {
      if (event.altKey) close(true);
      else moveFocus(current - 1);
    },
  ],
  [
    'ArrowDown',
    (current, event) => {
      if (event.altKey) close(true);
      else moveFocus(current + 1);
    },
  ],
  [
    'ArrowLeft',
    current => {
      moveFocus(current - 1);
    },
  ],
  [
    'ArrowRight',
    current => {
      moveFocus(current + 1);
    },
  ],
  [
    'Home',
    () => {
      moveFocus(0);
    },
  ],
  [
    'End',
    () => {
      moveFocus(props.options.length - 1);
    },
  ],
  [
    'PageUp',
    current => {
      moveFocus(current - perPage());
    },
  ],
  [
    'PageDown',
    current => {
      moveFocus(current + perPage());
    },
  ],
  [
    'Enter',
    current => {
      choose(current);
    },
  ],
  [
    ' ',
    current => {
      choose(current);
    },
  ],
  [
    'Escape',
    () => {
      close(true);
    },
  ],
]);

/**
 * Handles keys in the open list.
 *
 * @param event - The keyboard event.
 */
function onListKeyDown(event: KeyboardEvent): void {
  const current = Math.max(0, focusIndex.value);
  const action = listKeys.get(event.key);
  if (action) {
    event.preventDefault();
    action(current, event);
    return;
  }
  // Tab chooses the focused entry and moves on.
  if (event.key === 'Tab') {
    choose(current);
    return;
  }
  if (event.key.length !== 1) return;
  const index = typeAhead(event.key, current);
  if (index !== undefined) moveFocus(index);
}

/**
 * Chooses an entry on mouse release, unless it is the release of the opening click.
 *
 * @param index - The entry index.
 */
function onItemMouseUp(index: number): void {
  if (safeMouseUp) choose(index);
}

/**
 * Classes of an entry like the plugin: selected and focused entries are marked.
 *
 * @param index - The entry index.
 * @returns The classes.
 */
function itemClass(index: number): Record<string, boolean> {
  const selected = index === selectedIndex.value;
  const focused = index === focusIndex.value;
  return {
    'ui-corner-top': index === 0,
    'ui-corner-bottom': index === props.options.length - 1,
    'ui-selectmenu-item-selected': selected,
    'ui-state-active': selected && !focused,
    'ui-selectmenu-item-focus': focused,
    'ui-state-hover': focused,
  };
}

/**
 * Closes the list when the visitor clicks anywhere else.
 */
function onDocumentMouseDown(): void {
  close(false);
}

/**
 * Closes the list when the window size changes.
 */
function onResize(): void {
  close(false);
}

/**
 * Closes this list when another one opens.
 *
 * @param event - The event naming the opened list.
 */
function onOtherOpened(event: Event): void {
  if ((event as CustomEvent<string>).detail !== id) close(false);
}

onMounted(() => {
  // Like the plugin, take the width of the native select before hiding it.
  if (select.value) width.value = outerWidth(select.value);
  measured.value = true;
  void nextTick(() => {
    if (wrap.value) limitHeight(wrap.value);
  });
  document.addEventListener('mousedown', onDocumentMouseDown);
  document.addEventListener('ui-selectmenu-open', onOtherOpened);
  globalThis.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown);
  document.removeEventListener('ui-selectmenu-open', onOtherOpened);
  globalThis.removeEventListener('resize', onResize);
  globalThis.clearTimeout(safeTimer);
  globalThis.clearTimeout(typedTimer);
});
</script>

<template>
  <select
    ref="select"
    v-model="value"
    :name="name"
    :tabindex="tabindex"
    :class="selectClass || undefined"
    :style="measured ? { display: 'none' } : undefined"
  >
    <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
  </select>
  <div>
    <a
      :id="`${id}-button`"
      ref="button"
      class="ui-selectmenu ui-widget ui-state-default ui-corner-all ui-selectmenu-popup"
      :class="[
        selectClass,
        { 'ui-state-active': isOpen, 'ui-selectmenu-focus': buttonHover, 'ui-state-hover': buttonHover },
      ]"
      role="button"
      href="#nogo"
      :tabindex="tabindex"
      aria-haspopup="true"
      :aria-owns="`${id}-menu`"
      :style="width === undefined ? undefined : { width: `${width}px` }"
      @mousedown="onButtonMouseDown"
      @click.prevent
      @keydown="onButtonKeyDown"
      @mouseover="buttonHover = true"
      @focus="buttonHover = true"
      @mouseout="buttonHover = false"
      @blur="buttonHover = false"
      ><span class="ui-selectmenu-status">{{ selectedLabel }}</span
      ><span class="ui-selectmenu-icon ui-icon ui-icon-triangle-2-n-s"></span
    ></a>
  </div>
  <Teleport to="body">
    <div
      ref="wrap"
      class="ui-selectmenu-menu"
      :class="{ 'ui-selectmenu-open': isOpen }"
      :style="{ top: `${position.top}px`, left: `${position.left}px`, zIndex: position.zIndex }"
    >
      <ul
        :id="`${id}-menu`"
        ref="list"
        class="ui-widget ui-widget-content ui-selectmenu-menu-popup ui-corner-all"
        :class="selectClass"
        :aria-hidden="!isOpen"
        role="listbox"
        :aria-labelledby="`${id}-button`"
        :style="{
          width: width === undefined ? undefined : `${width}px`,
          height: listHeight === undefined ? 'auto' : `${listHeight}px`,
        }"
        @keydown="onListKeyDown"
        @mousedown.prevent.stop
      >
        <li
          v-for="(option, index) in options"
          :key="option.value"
          role="presentation"
          :class="itemClass(index)"
          @mouseup.prevent="onItemMouseUp(index)"
          @mouseover="focusIndex = index"
          @mouseout="focusIndex = -1"
        >
          <a href="#nogo" tabindex="-1" role="option" :aria-selected="index === selectedIndex" @click.prevent>{{
            option.label
          }}</a>
        </li>
      </ul>
    </div>
  </Teleport>
</template>
