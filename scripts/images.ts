/**
 * The images of the site are not part of this repository. `images.txt` lists every image the
 * site uses with its size and SHA-256 checksum. This script writes that list, checks the local
 * `img/` folder against it and downloads missing images from the live site.
 *
 * Usage: node scripts/images.ts list | check | fetch
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';

/**
 * Repository root.
 */
export const root = resolve(import.meta.dirname, '..');

/**
 * Local image folder, served under `/img/`.
 */
export const imageDir = join(root, 'img');

/**
 * The list of images with size and checksum.
 */
export const listFile = join(root, 'images.txt');

/**
 * Where images are downloaded from, unless `ANNO_IMAGE_BASE_URL` says otherwise.
 */
export const defaultBaseUrl = 'https://anno2070rechner.de';

/**
 * The first release whose live site serves the images of this list.
 */
const FIRST_RELEASE = [2, 0, 0];

/**
 * An image of the list.
 */
export interface ImageEntry {
  /**
   * Path below `img/`, with forward slashes.
   */
  path: string;

  /**
   * Size in bytes.
   */
  size: number;

  /**
   * SHA-256 checksum as hex.
   */
  sha256: string;
}

/**
 * Thrown when images cannot be downloaded; its message explains what to do instead.
 */
export class ImagesUnavailableError extends Error {
  public override name = 'ImagesUnavailableError';
}

const LIST_COLUMNS = 3;

const STATIC_REFERENCE = /\/img\/([\w./-]+\.(?:avif|gif|jpg|png|webp))/g;

/**
 * Lists the files below a folder.
 *
 * @param dir - The folder.
 * @returns Absolute paths of all files.
 */
const filesBelow = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? filesBelow(join(dir, entry.name)) : [join(dir, entry.name)],
  );

/**
 * Collects the images the site uses: every literal `/img/…` address in the stylesheets, source
 * files and build plugins, and the game icons, which the components build from the game data. All
 * buildings and products appear at 16 and 32 px, products also at 46 px.
 *
 * @returns Paths below `img/`, sorted.
 */
export function referencedImages(): string[] {
  const images = new Set<string>();
  const sources = [...filesBelow(join(root, 'src')), ...readdirSync(root).map(name => join(root, name))].filter(
    file => /\.(css|html|ts|vue)$/.test(file) && !file.endsWith('.test.ts') && !file.includes(join('src', 'tests')),
  );
  for (const file of sources) {
    for (const [, path] of readFileSync(file, 'utf8').matchAll(STATIC_REFERENCE)) images.add(path);
  }
  const data = JSON.parse(readFileSync(join(root, 'src/data/game-data.json'), 'utf8')) as {
    products: Record<string, string>;
    productionBuildings: { icon: string }[];
    buildings: { icon: string }[];
  };
  const productIcons = Object.values(data.products);
  const allIcons = [...productIcons, ...data.productionBuildings.map(b => b.icon), ...data.buildings.map(b => b.icon)];
  for (const icon of allIcons) {
    images.add(`icons/16/${icon}`);
    images.add(`icons/32/${icon}`);
  }
  for (const icon of productIcons) images.add(`icons/46/${icon}`);
  return [...images].toSorted((a, b) => a.localeCompare(b, 'en'));
}

/**
 * Computes the SHA-256 checksum of data.
 *
 * @param data - The data.
 * @returns The checksum as hex.
 */
const sha256 = (data: Buffer): string => createHash('sha256').update(data).digest('hex');

/**
 * Reads the image list.
 *
 * @param file - The list file.
 * @returns The entries.
 */
export function readList(file = listFile): ImageEntry[] {
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const [hash = '', size = '', path = ''] = line.split(' ', LIST_COLUMNS);
      return { path, size: Number(size), sha256: hash };
    });
}

/**
 * Writes the image list from the local images the site uses.
 *
 * @param dir - The image folder.
 * @param file - The list file.
 * @returns The entries.
 * @throws {Error} If a used image is missing locally.
 */
export function writeList(dir = imageDir, file = listFile): ImageEntry[] {
  const entries = referencedImages().map(path => {
    const data = readFileSync(join(dir, path));
    return { path, size: data.length, sha256: sha256(data) };
  });
  const lines = entries.map(entry => `${entry.sha256} ${entry.size} ${entry.path}`);
  writeFileSync(
    file,
    `# Images of the site: SHA-256, size, path below img/. Written by pnpm images:list.\n${lines.join('\n')}\n`,
  );
  return entries;
}

/**
 * Compares the local images with the list, by existence and size only, so it takes
 * milliseconds.
 *
 * @param entries - The list.
 * @param dir - The image folder.
 * @returns Missing images and images whose size differs.
 */
export function checkImages(entries = readList(), dir = imageDir): { missing: ImageEntry[]; changed: ImageEntry[] } {
  const missing: ImageEntry[] = [];
  const changed: ImageEntry[] = [];
  for (const entry of entries) {
    let size: number;
    try {
      size = statSync(join(dir, entry.path)).size;
    } catch {
      missing.push(entry);
      continue;
    }
    if (size !== entry.size) changed.push(entry);
  }
  return { missing, changed };
}

/**
 * Whether a version is at least the first release with these images.
 *
 * @param version - A version like `2.0.0`.
 * @returns Whether it is new enough.
 */
export function isReleased(version: string): boolean {
  const parts = /^(\d+)\.(\d+)\.(\d+)$/.exec(version.trim())?.slice(1).map(Number);
  if (!parts) return false;
  for (const [index, part] of parts.entries()) {
    const first = FIRST_RELEASE[index] ?? 0;
    if (part !== first) return part > first;
  }
  return true;
}

/**
 * The advice shown when images cannot be downloaded.
 *
 * @param reason - What went wrong.
 * @returns The message.
 */
export const unavailableMessage = (reason: string): string =>
  [
    reason,
    'Unpack the image ZIP instead:',
    '',
    '  scripts/setup-images.sh ~/path/to/anno2070rechner-images.zip',
    '',
    'Then run `pnpm dev` again.',
  ].join('\n');

/**
 * Fails unless the live site runs a release with the images of this list.
 *
 * @param baseUrl - Address of the site.
 * @param fetcher - The fetch function.
 * @throws {ImagesUnavailableError} If the site is older or has no `version.txt`.
 */
async function assertReleased(baseUrl: string, fetcher: typeof fetch): Promise<void> {
  const response = await fetcher(`${baseUrl}/version.txt`);
  const version = response.ok ? (await response.text()).trim() : '';
  if (isReleased(version)) return;
  throw new ImagesUnavailableError(
    unavailableMessage(
      `${baseUrl} does not serve the current images yet (needs v2.0.0, found: ${version || 'no version.txt'}).`,
    ),
  );
}

/**
 * Downloads one image and checks it against the list.
 *
 * @param entry - The image.
 * @param baseUrl - Address of the site.
 * @param fetcher - The fetch function.
 * @returns The image data.
 * @throws {ImagesUnavailableError} If the image is missing or differs.
 */
async function download(entry: ImageEntry, baseUrl: string, fetcher: typeof fetch): Promise<Buffer> {
  const response = await fetcher(`${baseUrl}/img/${entry.path}`);
  if (!response.ok) {
    throw new ImagesUnavailableError(
      unavailableMessage(`img/${entry.path} is missing on ${baseUrl} (${response.status}).`),
    );
  }
  const data = Buffer.from(await response.arrayBuffer());
  if (sha256(data) !== entry.sha256) {
    throw new ImagesUnavailableError(
      unavailableMessage(`img/${entry.path} on ${baseUrl} differs from the image list.`),
    );
  }
  return data;
}

/**
 * Writes a downloaded image unless the file appeared in the meantime.
 *
 * @param target - The file.
 * @param data - The image data.
 * @returns Whether the file was written.
 */
function writeNew(target: string, data: Buffer): boolean {
  if (existsSync(target)) return false;
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.download`;
  try {
    writeFileSync(temporary, data, { flag: 'wx' });
    renameSync(temporary, target);
  } finally {
    rmSync(temporary, { force: true });
  }
  return true;
}

/**
 * Downloads missing images from the live site. Nothing is written unless every image arrives
 * with the right checksum, and existing files are never replaced.
 *
 * @param missing - The images to download.
 * @param options - Base address, image folder and the fetch function.
 * @param options.baseUrl - Address of the site.
 * @param options.dir - The image folder.
 * @param options.fetcher - The fetch function.
 * @returns The written paths.
 * @throws {ImagesUnavailableError} If the live site is too old or an image is wrong.
 */
export async function fetchImages(
  missing: readonly ImageEntry[],
  {
    baseUrl = process.env.ANNO_IMAGE_BASE_URL ?? defaultBaseUrl,
    dir = imageDir,
    fetcher = globalThis.fetch,
  }: { baseUrl?: string; dir?: string; fetcher?: typeof fetch } = {},
): Promise<string[]> {
  if (missing.length === 0) return [];
  await assertReleased(baseUrl, fetcher);
  const downloads: { entry: ImageEntry; data: Buffer }[] = [];
  for (const entry of missing) downloads.push({ entry, data: await download(entry, baseUrl, fetcher) });
  return downloads.filter(({ entry, data }) => writeNew(join(dir, entry.path), data)).map(({ entry }) => entry.path);
}

/**
 * Describes images whose size differs from the list.
 *
 * @param changed - The images.
 * @returns The warning.
 */
export const changedMessage = (changed: readonly ImageEntry[]): string =>
  [
    `${changed.length} image${changed.length === 1 ? '' : 's'} differ from the image list (e.g. img/${changed[0]?.path ?? ''}).`,
    'Changed on purpose? Run `pnpm images:list` to update the list.',
    'Outdated? Delete them and restart to download the current ones.',
  ].join('\n');

const print = (text: string): void => void process.stdout.write(`${text}\n`);
const printError = (text: string): void => void process.stderr.write(`${text}\n`);

/**
 * Runs the command line.
 *
 * @param command - `list`, `check` or `fetch`.
 * @returns The exit code.
 */
async function main(command: string | undefined): Promise<number> {
  if (command === 'list') {
    const entries = writeList();
    print(`Wrote ${relative(root, listFile)} with ${entries.length} images.`);
    return 0;
  }
  if (command !== 'check' && command !== 'fetch') {
    printError('Usage: node scripts/images.ts list | check | fetch');
    return 2;
  }
  const { missing, changed } = checkImages();
  if (changed.length > 0) printError(changedMessage(changed));
  if (missing.length === 0) {
    print('All images are there.');
    return 0;
  }
  if (command === 'check') {
    printError(`${missing.length} images are missing (e.g. img/${missing[0]?.path ?? ''}).`);
    return 1;
  }
  try {
    const written = await fetchImages(missing);
    print(`Downloaded ${written.length} images.`);
    return 0;
  } catch (error) {
    if (!(error instanceof ImagesUnavailableError)) throw error;
    printError(error.message);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  process.exitCode = await main(process.argv[2]);
}
