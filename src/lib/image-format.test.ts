import { afterEach, describe, expect, it, vi } from 'vitest';

import { backgroundUrl } from '../models/background';

import { detectImageFormat, imageFormat } from './image-format';

/**
 * Replaces the browser's image loading with one that decodes only the given formats.
 *
 * @param supported - The formats the fake browser decodes.
 */
function fakeBrowser(...supported: string[]): void {
  vi.stubGlobal(
    'Image',
    class {
      public width = 0;
      private readonly listeners = new Map<string, () => void>();
      public set src(source: string) {
        const format = /^data:image\/(\w+);/.exec(source)?.[1] ?? '';
        globalThis.setTimeout(() => {
          if (supported.includes(format)) this.width = 1;
          this.listeners.get(supported.includes(format) ? 'load' : 'error')?.();
        }, 0);
      }
      public addEventListener(type: string, listener: () => void): void {
        this.listeners.set(type, listener);
      }
    },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('detectImageFormat', () => {
  it('prefers AVIF and marks it for the stylesheet', async () => {
    fakeBrowser('avif', 'webp');
    const root = globalThis.document.createElement('html');
    expect(await detectImageFormat(root)).toBe('avif');
    expect(root.className).toBe('img-avif');
    expect(backgroundUrl('eco3')).toBe('/img/bg-body-eco3.avif');
  });

  it('falls back to WebP', async () => {
    fakeBrowser('webp');
    const root = globalThis.document.createElement('html');
    expect(await detectImageFormat(root)).toBe('webp');
    expect(root.className).toBe('img-webp');
  });

  it('keeps JPG for browsers without either format', async () => {
    fakeBrowser();
    const root = globalThis.document.createElement('html');
    expect(await detectImageFormat(root)).toBe('jpg');
    expect(root.className).toBe('');
    expect(imageFormat()).toBe('jpg');
    expect(backgroundUrl('tycoon1')).toBe('/img/bg-body-tycoon1.jpg');
  });
});
