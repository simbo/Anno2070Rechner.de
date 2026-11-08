/**
 * Standard names for the keys of old browsers, which use other names or no `key` at all.
 */
const oldNames: Record<string, string> = {
  Del: 'Delete',
  Down: 'ArrowDown',
  Esc: 'Escape',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
  Spacebar: ' ',
  Up: 'ArrowUp',
};

/**
 * Key names by key code, for browsers without `KeyboardEvent.key`.
 */
const codeNames: Record<number, string> = {
  8: 'Backspace',
  9: 'Tab',
  13: 'Enter',
  27: 'Escape',
  32: ' ',
  33: 'PageUp',
  34: 'PageDown',
  35: 'End',
  36: 'Home',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  46: 'Delete',
};

/**
 * The parts of a keyboard event that old browsers may have.
 */
interface OldKeyEvent {
  key?: string;
  keyCode: number;
}

/**
 * The standard name of a pressed key, also in browsers from before it was standardized.
 *
 * @param event - The keyboard event.
 * @returns The key name, like `KeyboardEvent.key` in current browsers.
 */
export function keyName(event: OldKeyEvent): string {
  return event.key
    ? (oldNames[event.key] ?? event.key)
    : (codeNames[event.keyCode] ?? String.fromCodePoint(event.keyCode));
}
