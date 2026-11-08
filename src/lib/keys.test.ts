import { describe, expect, it } from 'vitest';

import { keyName } from './keys';

describe('keyName', () => {
  it('keeps standard names', () => {
    expect(keyName({ key: 'ArrowDown', keyCode: 40 })).toBe('ArrowDown');
    expect(keyName({ key: 'a', keyCode: 65 })).toBe('a');
  });

  it('translates the names of old browsers', () => {
    expect(keyName({ key: 'Esc', keyCode: 27 })).toBe('Escape');
    expect(keyName({ key: 'Down', keyCode: 40 })).toBe('ArrowDown');
    expect(keyName({ key: 'Spacebar', keyCode: 32 })).toBe(' ');
  });

  it('falls back to the key code', () => {
    expect(keyName({ key: '', keyCode: 13 })).toBe('Enter');
    expect(keyName({ key: '', keyCode: 65 })).toBe('A');
  });
});
