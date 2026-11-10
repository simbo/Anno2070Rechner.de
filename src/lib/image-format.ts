/**
 * The best format the browser can show for the background images. AVIF and WebP are much
 * smaller than the JPG files, which stay as the fallback for older browsers.
 */
export type ImageFormat = 'avif' | 'webp' | 'jpg';

/**
 * Tiny images of each modern format. A browser that decodes one supports the format.
 */
const probes: Record<Exclude<ImageFormat, 'jpg'>, string> = {
  avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUEAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAJwAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBIAAAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAL21kYXQSAAoHOAAGkBDQaTIaF4JjBMJJJJMoAAAASFQ2YaxigAo2v/Kx90A=',
  webp: 'data:image/webp;base64,UklGRhwAAABXRUJQVlA4TA8AAAAvAAAAAAcQ/Y/+ByKi/wEA',
};

let current: ImageFormat = 'jpg';

/**
 * Checks whether the browser decodes an image.
 *
 * @param source - The image address.
 * @returns Whether the image loaded with a size.
 */
async function decodes(source: string): Promise<boolean> {
  return new Promise(resolve => {
    const image = new Image();
    image.addEventListener('load', () => {
      resolve(image.width > 0);
    });
    image.addEventListener('error', () => {
      resolve(false);
    });
    image.src = source;
  });
}

/**
 * Finds the best supported format, marks it on the root element as `img-avif` or `img-webp`
 * for the stylesheet and remembers it for {@link imageFormat}. Runs once before the app starts,
 * so that the browser loads only one version of the background.
 *
 * @param root - The element that gets the class.
 * @returns The format.
 */
export async function detectImageFormat(root: Element = globalThis.document.documentElement): Promise<ImageFormat> {
  current = (await decodes(probes.avif)) ? 'avif' : (await decodes(probes.webp)) ? 'webp' : 'jpg';
  if (current !== 'jpg') root.classList.add(`img-${current}`);
  return current;
}

/**
 * The format found by {@link detectImageFormat}, or JPG before it ran.
 *
 * @returns The format.
 */
export const imageFormat = (): ImageFormat => current;
