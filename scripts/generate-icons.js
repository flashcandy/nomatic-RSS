import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const iconSvg = path.join(publicDir, 'icon.svg');
const maskableSvg = path.join(publicDir, 'icon-maskable.svg');

async function generateIcons() {
  console.log('Generating high-res PWA PNG icons from lovable SVG...');

  const svgBuffer = fs.readFileSync(iconSvg);
  const maskableSvgBuffer = fs.readFileSync(maskableSvg);

  // 1. 192x192 PWA Icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('✓ Created pwa-192x192.png');

  // 2. 512x512 PWA Icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('✓ Created pwa-512x512.png');

  // 3. 512x512 Maskable Icon
  await sharp(maskableSvgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('✓ Created pwa-maskable-512x512.png');

  // 4. Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created apple-touch-icon.png');

  // 5. Favicon PNG (32x32 and 48x48)
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ Created favicon.png');

  // 6. Favicon ICO fallback
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✓ Created favicon.ico');

  console.log('All PWA icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
