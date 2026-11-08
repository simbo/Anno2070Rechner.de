import { describe, expect, it } from 'vitest';

import { flatten, fromEntries } from './compat';

describe('flatten', () => {
  it('joins nested lists in order', () => {
    expect(flatten([[1, 2], [], [3]])).toEqual([1, 2, 3]);
  });
});

describe('fromEntries', () => {
  it('builds an object, later entries winning', () => {
    expect(
      fromEntries([
        ['a', 1],
        ['b', 2],
        ['a', 3],
      ]),
    ).toEqual({ a: 3, b: 2 });
  });
});
