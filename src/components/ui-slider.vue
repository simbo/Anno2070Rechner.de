<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * A horizontal slider that renders and behaves like the jQuery UI 1.8 slider of the
 * old site (range "min"), so the existing styles apply unchanged.
 */
const props = withDefaults(defineProps<{ min: number; max: number; step?: number; tabindex?: number | string }>(), {
  step: 1,
  tabindex: undefined,
});

const value = defineModel<number>({ required: true });

const emit = defineEmits<{
  start: [];
  slide: [value: number];
  stop: [];
  'handle-focus': [];
  'handle-blur': [];
}>();

const { document } = globalThis;

/**
 * Full width of the slider in percent.
 */
const FULL = 100;

/**
 * Page Up and Page Down move by a fifth of the range, like jQuery UI.
 */
const PAGES = 5;

/**
 * Decimal places jQuery UI keeps when aligning values to the step.
 */
const ALIGN_PRECISION = 5;

const root = ref<HTMLElement>();
const handle = ref<HTMLElement>();
const hover = ref(false);
const focus = ref(false);
const active = ref(false);

const percent = computed(() => {
  const span = props.max - props.min;
  const position = span === 0 ? 0 : ((value.value - props.min) / span) * FULL;
  return Math.min(FULL, Math.max(0, position));
});

/**
 * Clamps a value to the range and aligns it to the step, like jQuery UI's `_trimAlignValue`.
 *
 * @param input - The raw value.
 * @returns The aligned value.
 */
function trimAlign(input: number): number {
  if (input <= props.min) return props.min;
  if (input >= props.max) return props.max;
  const step = props.step > 0 ? props.step : 1;
  const remainder = (input - props.min) % step;
  let aligned = input - remainder;
  if (Math.abs(remainder) * 2 >= step) aligned += remainder > 0 ? step : -step;
  return Number(aligned.toFixed(ALIGN_PRECISION));
}

/**
 * Moves the slider and reports the new value, like jQuery UI's `_slide`.
 *
 * @param next - The new value.
 */
function slide(next: number): void {
  if (next === value.value) return;
  value.value = next;
  emit('slide', next);
}

let clickOffset = 0;

/**
 * The value at the mouse position.
 *
 * @param event - The mouse event.
 * @returns The aligned value, or the current value without a rendered slider.
 */
function valueFromMouse(event: MouseEvent): number {
  if (!root.value) return value.value;
  const box = root.value.getBoundingClientRect();
  const fraction = Math.min(1, Math.max(0, (event.clientX - box.left - clickOffset) / root.value.offsetWidth));
  return trimAlign(props.min + fraction * (props.max - props.min));
}

/**
 * Follows the mouse while dragging.
 *
 * @param event - The mouse event.
 */
function onMouseMove(event: MouseEvent): void {
  event.preventDefault();
  slide(valueFromMouse(event));
}

/**
 * Ends dragging.
 */
function onMouseUp(): void {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  active.value = false;
  emit('stop');
}

/**
 * Starts dragging. Clicking the track jumps there; grabbing the handle does not move it.
 *
 * @param event - The mouse event.
 */
function onMouseDown(event: MouseEvent): void {
  if (event.button !== 0 || !handle.value) return;
  event.preventDefault();
  const box = handle.value.getBoundingClientRect();
  clickOffset = event.target === handle.value ? event.clientX - box.left - box.width / 2 : 0;
  emit('start');
  active.value = true;
  handle.value.focus();
  if (!hover.value) slide(valueFromMouse(event));
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

// New values per key, like jQuery UI's keyboard handling. Arrow keys stop at the ends.
const keyMoves = new Map<string, (current: number) => number>([
  ['Home', () => props.min],
  ['End', () => props.max],
  ['PageUp', current => trimAlign(current + (props.max - props.min) / PAGES)],
  ['PageDown', current => trimAlign(current - (props.max - props.min) / PAGES)],
  ['ArrowUp', current => (current === props.max ? current : trimAlign(current + props.step))],
  ['ArrowRight', current => (current === props.max ? current : trimAlign(current + props.step))],
  ['ArrowDown', current => (current === props.min ? current : trimAlign(current - props.step))],
  ['ArrowLeft', current => (current === props.min ? current : trimAlign(current - props.step))],
]);

let keySliding = false;

/**
 * Moves the slider with the keyboard.
 *
 * @param event - The keyboard event.
 */
function onKeyDown(event: KeyboardEvent): void {
  const move = keyMoves.get(event.key);
  if (!move) return;
  event.preventDefault();
  if (!keySliding) {
    keySliding = true;
    active.value = true;
    emit('start');
  }
  slide(move(value.value));
}

/**
 * Ends a keyboard move.
 */
function onKeyUp(): void {
  if (!keySliding) return;
  keySliding = false;
  active.value = false;
  emit('stop');
}

/**
 * Marks the focused handle.
 */
function onFocus(): void {
  focus.value = true;
  emit('handle-focus');
}

/**
 * Unmarks the handle when it loses focus.
 */
function onBlur(): void {
  focus.value = false;
  emit('handle-blur');
}

defineExpose({ handle });
</script>

<template>
  <div
    ref="root"
    class="ui-slider ui-slider-horizontal ui-widget ui-widget-content ui-corner-all"
    @mousedown="onMouseDown"
  >
    <div class="ui-slider-range ui-widget-header ui-slider-range-min" :style="{ width: `${percent}%` }"></div>
    <a
      ref="handle"
      class="ui-slider-handle ui-state-default ui-corner-all"
      :class="{ 'ui-state-hover': hover, 'ui-state-focus': focus, 'ui-state-active': active }"
      href="#"
      :tabindex="tabindex"
      :style="{ left: `${percent}%` }"
      @click.prevent
      @mouseenter="hover = true"
      @mouseleave="hover = false"
      @focus="onFocus"
      @blur="onBlur"
      @keydown="onKeyDown"
      @keyup="onKeyUp"
    ></a>
  </div>
</template>
