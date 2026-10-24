import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const iconsDir = path.join(root, "public", "assets", "icons");
const assetsDir = path.join(root, "public", "assets");
const sourcePng = path.join(assetsDir, "logo-source.png");
const maskablePng = path.join(assetsDir, "logo-mark-maskable.png");

await access(sourcePng);

const standardSizes = [16, 32, 57, 60, 72, 76, 96, 114, 120, 128, 144, 152, 180, 192, 384, 512];
const appleSizes = [57, 60, 72, 76, 114, 120, 144, 152, 180];

await mkdir(iconsDir, { recursive: true });

// The source art is a logo in the middle of a big white square. Used as-is, a favicon shows a tiny logo in a
// white box. So: key the white out to transparency, crop tight to the mark, and fill the icon with it.
async function buildMark() {
  const crop = { left: 235, top: 215, width: 560, height: 595 };
  const { data, info } = await sharp(sourcePng).extract(crop).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const lightest = Math.min(data[i], data[i + 1], data[i + 2]);
    data[i + 3] = Math.max(0, Math.min(255, Math.round((255 - lightest) * 3)));
  }
  const side = Math.max(info.width, info.height);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extend({
      top: Math.floor((side - info.height) / 2), bottom: Math.ceil((side - info.height) / 2),
      left: Math.floor((side - info.width) / 2), right: Math.ceil((side - info.width) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

const markPng = await buildMark();

/** Transparent favicon: the mark fills the canvas (small padding so it never touches the edge). */
async function renderPng(size, outputPath, { background = null, fill = 0.94 } = {}) {
  const inner = Math.round(size * fill);
  const mark = await sharp(markPng).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const base = sharp({ create: { width: size, height: size, channels: 4, background: background ?? { r: 0, g: 0, b: 0, alpha: 0 } } });
  await base.composite([{ input: mark, gravity: "centre" }]).png().toFile(outputPath);
}

/** Opaque icon (iOS home screen, PWA): the mark on white, large enough to read. */
const renderOpaquePng = (size, outputPath) => renderPng(size, outputPath, { background: { r: 255, g: 255, b: 255, alpha: 1 }, fill: 0.74 });

async function renderMaskablePng(size, outputPath) {
  await sharp(maskablePng)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png()
    .toFile(outputPath);
}

for (const size of standardSizes) {
  if (size <= 32) await renderPng(size, path.join(iconsDir, `icon-${size}x${size}.png`));
  else await renderOpaquePng(size, path.join(iconsDir, `icon-${size}x${size}.png`));
}

for (const size of appleSizes) {
  await renderOpaquePng(size, path.join(iconsDir, `apple-icon-${size}x${size}.png`));
}

for (const size of [16, 32, 96]) {
  await renderPng(size, path.join(iconsDir, `favicon-${size}x${size}.png`));
}

await renderOpaquePng(192, path.join(iconsDir, "icon-192x192.png"));
await renderMaskablePng(192, path.join(iconsDir, "android-icon-192x192.png"));
await renderOpaquePng(512, path.join(iconsDir, "icon-512x512.png"));
await renderOpaquePng(180, path.join(iconsDir, "apple-touch-icon.png"));
await renderOpaquePng(180, path.join(iconsDir, "apple-icon-precomposed.png"));
await renderOpaquePng(180, path.join(iconsDir, "apple-icon.png"));

// A real multi-size .ico (PNG entries) so browsers that ask for /favicon.ico get a crisp, transparent icon.
const icoSizes = [16, 32, 48];
const icoImages = [];
for (const size of icoSizes) {
  const file = path.join(iconsDir, `favicon-${size}x${size}.png`);
  if (size === 48) await renderPng(48, file);
  icoImages.push(await sharp(file).png().toBuffer());
}
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoImages.length, 4);
let offset = 6 + 16 * icoImages.length;
const entries = icoImages.map((image, index) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(icoSizes[index], 0);
  entry.writeUInt8(icoSizes[index], 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(image.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += image.length;
  return entry;
});
await writeFile(path.join(root, "public", "favicon.ico"), Buffer.concat([header, ...entries, ...icoImages]));
await sharp(markPng).resize(512, 512).png().toFile(path.join(assetsDir, "logo-mark-transparent.png"));

console.log("Icons generated in public/assets/icons and public/favicon.ico");
