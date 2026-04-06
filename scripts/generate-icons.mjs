/**
 * Generate PWA icons from favicon.svg
 * Run: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SIZES = [192, 512];

for (const size of SIZES) {
  const input = join(ROOT, 'public', 'favicon.svg');
  const output = join(ROOT, 'public', `pwa-${size}x${size}.png`);

  await sharp(input)
    .resize(size, size, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 0 } })
    .png()
    .toFile(output);

  console.log(`✓ ${output} (${size}x${size})`);
}

console.log('Done.');
