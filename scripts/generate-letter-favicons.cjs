/**
 * Generates public/favicons/<folder>/favicon.ico for each site JSON:
 * letter = first Unicode letter in header.logoText (after stripping www.),
 * colors = deterministic HSL from site id for a readable badge.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');

const root = path.join(__dirname, '..');
const configDir = path.join(root, 'src', 'config');

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function firstLetter(logoText) {
  const host = String(logoText || '')
    .trim()
    .replace(/^www\./i, '');
  const m = host.match(/\p{L}/u);
  return m ? m[0].toUpperCase() : '?';
}

function hslFromString(str) {
  let h = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i += 1) {
    h = s.charCodeAt(i) + ((h << 5) - h);
  }
  const hue = Math.abs(h % 360);
  return {
    bg: `hsl(${hue}, 62%, 36%)`,
    fg: '#f8fafc',
  };
}

async function pngFromLetter(letter, bgHexOrCss, fg, size) {
  const escaped = escapeXml(letter);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="${bgHexOrCss}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif"
    font-weight="700" font-size="${Math.round(size * 0.58)}" fill="${fg}">${escaped}</text>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function writeFavicon(dir, letter, colors) {
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(
    sizes.map((sz) => pngFromLetter(letter, colors.bg, colors.fg, sz))
  );
  const ico = await toIco(pngs);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, 'favicon.ico'), ico);
}

async function main() {
  const files = (await fs.promises.readdir(configDir)).filter((f) =>
    f.endsWith('.json')
  );
  for (const file of files) {
    const jsonPath = path.join(configDir, file);
    const raw = JSON.parse(await fs.promises.readFile(jsonPath, 'utf8'));
    const fav = raw.assets?.faviconPath;
    const logo = raw.header?.logoText;
    if (!fav || !logo) {
      console.warn('skip (missing path/logo):', file);
      continue;
    }
    const rel = fav.replace(/^\//, '');
    const outDir = path.join(root, 'public', rel);
    const letter = firstLetter(logo);
    const siteId = path.basename(rel);
    const colors = hslFromString(siteId + letter);
    await writeFavicon(outDir, letter, colors);
    console.log('wrote', path.join(rel, 'favicon.ico'), letter);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
