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

async function renderPng(size, outputPath) {
  await sharp(sourcePng)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png()
    .toFile(outputPath);
}

async function renderMaskablePng(size, outputPath) {
  await sharp(maskablePng)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png()
    .toFile(outputPath);
}

for (const size of standardSizes) {
  await renderPng(size, path.join(iconsDir, `icon-${size}x${size}.png`));
}

for (const size of appleSizes) {
  await renderPng(size, path.join(iconsDir, `apple-icon-${size}x${size}.png`));
}

for (const size of [16, 32, 96]) {
  await renderPng(size, path.join(iconsDir, `favicon-${size}x${size}.png`));
}

await renderPng(192, path.join(iconsDir, "icon-192x192.png"));
await renderMaskablePng(192, path.join(iconsDir, "android-icon-192x192.png"));
await renderPng(512, path.join(iconsDir, "icon-512x512.png"));
await renderPng(180, path.join(iconsDir, "apple-touch-icon.png"));
await renderPng(180, path.join(iconsDir, "apple-icon-precomposed.png"));
await renderPng(180, path.join(iconsDir, "apple-icon.png"));

const favicon32 = await sharp(path.join(iconsDir, "favicon-32x32.png")).toBuffer();
await writeFile(path.join(root, "public", "favicon.ico"), favicon32);

console.log("Icons generated in public/assets/icons and public/favicon.ico");
