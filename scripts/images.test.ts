// @vitest-environment node
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  checkImages,
  fetchImages,
  ImagesUnavailableError,
  isReleased,
  readList,
  referencedImages,
  type ImageEntry,
} from './images.ts';

const folders: string[] = [];

/**
 * Creates an empty temporary folder that is removed after the test.
 *
 * @returns The folder.
 */
function temporaryFolder(): string {
  const folder = mkdtempSync(join(tmpdir(), 'anno-images-'));
  folders.push(folder);
  return folder;
}

/**
 * Describes data as an entry of the image list.
 *
 * @param path - The path below `img/`.
 * @param data - The image data.
 * @returns The entry.
 */
const entryOf = (path: string, data: string): ImageEntry => ({
  path,
  size: Buffer.byteLength(data),
  sha256: createHash('sha256').update(data).digest('hex'),
});

/**
 * A fake live site.
 *
 * @param version - Content of `version.txt`, or nothing for a site without it.
 * @param files - Images by path below `img/`.
 * @returns The fetch function.
 */
const site =
  (version: string | undefined, files: Record<string, string>): typeof fetch =>
  async input => {
    const path = (input instanceof Request ? input.url : input.toString()).replace('https://example.test/', '');
    const body = path === 'version.txt' ? version : files[path.replace(/^img\//, '')];
    return body === undefined ? new Response('', { status: 404 }) : new Response(body);
  };

afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

describe('images.txt', () => {
  it('lists exactly the images the site uses', () => {
    expect(readList().map(entry => entry.path)).toEqual(referencedImages());
  });

  it('includes the game icons, the backgrounds in every format and the header tab', () => {
    const images = referencedImages();
    expect(images).toEqual(
      expect.arrayContaining([
        'icons/16/icon_27_0.png',
        'icons/32/icon_27_0.png',
        'icons/46/icon_27_0.png',
        'bg-body-eco1.avif',
        'bg-body-eco1.webp',
        'bg-body-eco1.jpg',
        'bg-header-tab-middle.png',
        'logo.png',
      ]),
    );
  });
});

describe('checkImages', () => {
  it('finds missing images and images with another size', () => {
    const dir = temporaryFolder();
    writeFileSync(join(dir, 'same.png'), 'same');
    writeFileSync(join(dir, 'edited.png'), 'edited on purpose');
    const result = checkImages(
      [entryOf('same.png', 'same'), entryOf('edited.png', 'old'), entryOf('gone.png', 'x')],
      dir,
    );
    expect(result.missing.map(entry => entry.path)).toEqual(['gone.png']);
    expect(result.changed.map(entry => entry.path)).toEqual(['edited.png']);
  });
});

describe('isReleased', () => {
  it('accepts v2.0.0 and later', () => {
    expect(isReleased('2.0.0')).toBe(true);
    expect(isReleased('2.1.0\n')).toBe(true);
    expect(isReleased('10.0.0')).toBe(true);
    expect(isReleased('1.9.9')).toBe(false);
    expect(isReleased('')).toBe(false);
    expect(isReleased('<html>')).toBe(false);
  });
});

describe('fetchImages', () => {
  const baseUrl = 'https://example.test';
  const icon = entryOf('icons/16/a.png', 'icon');
  const header = entryOf('bg-header.png', 'header');

  it('downloads missing images from a released site', async () => {
    const dir = temporaryFolder();
    const fetcher = site('2.0.0\n', { 'icons/16/a.png': 'icon', 'bg-header.png': 'header' });
    expect(await fetchImages([icon, header], { baseUrl, dir, fetcher })).toEqual(['icons/16/a.png', 'bg-header.png']);
    expect(readFileSync(join(dir, 'icons/16/a.png'), 'utf8')).toBe('icon');
  });

  it('refuses a site before v2.0.0 and points to the image ZIP', async () => {
    const dir = temporaryFolder();
    const result = fetchImages([icon], { baseUrl, dir, fetcher: site(undefined, { 'icons/16/a.png': 'icon' }) });
    await expect(result).rejects.toThrow(ImagesUnavailableError);
    await expect(result).rejects.toThrow(/no version\.txt[\s\S]*scripts\/setup-images\.sh/);
    expect(existsSync(join(dir, 'icons'))).toBe(false);
  });

  it('writes nothing if one image is wrong', async () => {
    const dir = temporaryFolder();
    const fetcher = site('2.0.0', { 'icons/16/a.png': 'icon', 'bg-header.png': 'tampered' });
    await expect(fetchImages([icon, header], { baseUrl, dir, fetcher })).rejects.toThrow(/differs from the image list/);
    expect(existsSync(join(dir, 'icons/16/a.png'))).toBe(false);
  });

  it('never replaces an existing file', async () => {
    const dir = temporaryFolder();
    writeFileSync(join(dir, 'bg-header.png'), 'mine');
    const fetcher = site('2.0.0', { 'bg-header.png': 'header' });
    expect(await fetchImages([header], { baseUrl, dir, fetcher })).toEqual([]);
    expect(readFileSync(join(dir, 'bg-header.png'), 'utf8')).toBe('mine');
  });
});
