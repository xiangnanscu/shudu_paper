const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  const outDir = path.resolve(__dirname, '../frontend/public/icons');
  if (fs.existsSync(path.join(outDir, 'icon-512x512.png'))) {
    console.log('PWA icons already exist, skipping generation (sharp not installed).');
    process.exit(0);
  }
  console.error('Error: sharp module not found and icons do not exist.');
  process.exit(1);
}

// Ensure output directories exist
const outDir = path.resolve(__dirname, '../frontend/public/icons');
fs.mkdirSync(outDir, { recursive: true });

// SVG template for the Sudoku 4x4 App Icon
// Size: 512x512
// Safe zone for maskable icon: circle centered at (256,256) with radius 204.
function getSvg(isMaskable = false) {
  // If maskable, full bleed rectangle without rounded corners so OS handles masking.
  // If not maskable, we can still use full bleed or subtle rounded corners.
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="50%" stop-color="#2563eb" />
      <stop offset="100%" stop-color="#1d4ed8" />
    </linearGradient>
    <linearGradient id="cellGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f8fafc" />
    </linearGradient>
    <linearGradient id="cellGradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7" />
      <stop offset="100%" stop-color="#fde68a" />
    </linearGradient>
    <linearGradient id="cellGradEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d1fae5" />
      <stop offset="100%" stop-color="#a7f3d0" />
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="125%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#0f172a" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="${isMaskable ? 0 : 100}" fill="url(#bgGrad)" />

  <!-- Sudoku Grid Container with Shadow (located strictly inside 80% safe zone: 76px to 436px) -->
  <g filter="url(#cardShadow)">
    <rect x="86" y="86" width="340" height="340" rx="32" fill="#0f172a" />
  </g>

  <!-- Grid White Outline & Cells Background -->
  <g>
    <!-- 4x4 Grid Cells (Total board 336x336, from 88 to 424) -->
    <!-- Cell size 78, gap 6, thick divider gap 12 -->
    <!-- X offsets: 96, 174, 260, 338 -->
    <!-- Y offsets: 96, 174, 260, 338 -->

    <!-- Row 1 -->
    <rect x="96" y="96" width="74" height="74" rx="14" fill="url(#cellGrad1)" />
    <text x="133" y="148" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#2563eb" text-anchor="middle">1</text>

    <rect x="174" y="96" width="74" height="74" rx="14" fill="url(#cellGrad1)" />
    <text x="211" y="148" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#64748b" text-anchor="middle">2</text>

    <rect x="264" y="96" width="74" height="74" rx="14" fill="url(#cellGradEmerald)" />
    <text x="301" y="148" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#059669" text-anchor="middle">3</text>

    <rect x="342" y="96" width="74" height="74" rx="14" fill="url(#cellGrad1)" />
    <text x="379" y="148" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#64748b" text-anchor="middle">4</text>

    <!-- Row 2 -->
    <rect x="96" y="174" width="74" height="74" rx="14" fill="url(#cellGrad1)" />
    <text x="133" y="226" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#64748b" text-anchor="middle">3</text>

    <rect x="174" y="174" width="74" height="74" rx="14" fill="url(#cellGradAccent)" />
    <text x="211" y="226" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#d97706" text-anchor="middle">4</text>

    <rect x="264" y="174" width="74" height="74" rx="14" fill="url(#cellGrad1)" />
    <text x="301" y="226" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#2563eb" text-anchor="middle">1</text>

    <rect x="342" y="174" width="74" height="74" rx="14" fill="url(#cellGrad1)" />
    <text x="379" y="226" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#64748b" text-anchor="middle">2</text>

    <!-- Thick dividing gap in vertical/horizontal -->
    <!-- Row 3 -->
    <rect x="96" y="264" width="74" height="74" rx="14" fill="url(#cellGradEmerald)" />
    <text x="133" y="316" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#059669" text-anchor="middle">2</text>

    <rect x="174" y="264" width="74" height="74" rx="14" fill="url(#cellGrad1)" />
    <text x="211" y="316" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#64748b" text-anchor="middle">1</text>

    <rect x="264" y="264" width="74" height="74" rx="14" fill="url(#cellGrad1)" />
    <text x="301" y="316" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#64748b" text-anchor="middle">4</text>

    <rect x="342" y="264" width="74" height="74" rx="14" fill="url(#cellGradAccent)" />
    <text x="379" y="316" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#d97706" text-anchor="middle">3</text>

    <!-- Row 4 -->
    <rect x="96" y="342" width="74" height="74" rx="14" fill="url(#cellGrad1)" />
    <text x="133" y="394" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#64748b" text-anchor="middle">4</text>

    <rect x="174" y="342" width="74" height="74" rx="14" fill="url(#cellGrad1)" />
    <text x="211" y="394" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#2563eb" text-anchor="middle">3</text>

    <rect x="264" y="342" width="74" height="74" rx="14" fill="url(#cellGrad1)" />
    <text x="301" y="394" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#64748b" text-anchor="middle">2</text>

    <rect x="342" y="342" width="74" height="74" rx="14" fill="url(#cellGrad1)" />
    <text x="379" y="394" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="800" fill="#059669" text-anchor="middle">1</text>
  </g>
</svg>
`;
}

async function run() {
  console.log('Generating PWA icons...');
  const svgStandard = Buffer.from(getSvg(false));
  const svgMaskable = Buffer.from(getSvg(true));

  // Save base SVG to public
  fs.writeFileSync(path.join(outDir, 'icon.svg'), svgStandard);
  fs.writeFileSync(path.resolve(__dirname, '../frontend/public/favicon.svg'), svgStandard);

  // 192x192
  await sharp(svgStandard)
    .resize(192, 192)
    .png()
    .toFile(path.join(outDir, 'icon-192x192.png'));
  console.log('Created icon-192x192.png');

  // 512x512
  await sharp(svgStandard)
    .resize(512, 512)
    .png()
    .toFile(path.join(outDir, 'icon-512x512.png'));
  console.log('Created icon-512x512.png');

  // 192x192 maskable
  await sharp(svgMaskable)
    .resize(192, 192)
    .png()
    .toFile(path.join(outDir, 'icon-maskable-192x192.png'));
  console.log('Created icon-maskable-192x192.png');

  // 512x512 maskable
  await sharp(svgMaskable)
    .resize(512, 512)
    .png()
    .toFile(path.join(outDir, 'icon-maskable-512x512.png'));
  console.log('Created icon-maskable-512x512.png');

  // apple-touch-icon (180x180, square solid background)
  await sharp(svgMaskable)
    .resize(180, 180)
    .png()
    .toFile(path.join(outDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // favicon-32x32.png
  await sharp(svgStandard)
    .resize(32, 32)
    .png()
    .toFile(path.join(outDir, 'favicon-32x32.png'));
  console.log('Created favicon-32x32.png');

  console.log('All icons generated successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
