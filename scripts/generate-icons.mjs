import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const iconsDir = path.join(root, "public", "assets", "icons");
const standardSvg = path.join(root, "public", "assets", "logo-mark.svg");
const maskableSvg = path.join(root, "public", "assets", "logo-mark-maskable.svg");

const standardSizes = [16, 32, 57, 60, 72, 76, 96, 114, 120, 128, 144, 152, 180, 192, 384, 512];
const appleSizes = [57, 60, 72, 76, 114, 120, 144, 152, 180];

await mkdir(iconsDir, { recursive: true });

async function renderPng(svgPath, size, outputPath) {
  await sharp(svgPath)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outputPath);
}

for (const size of standardSizes) {
  await renderPng(standardSvg, size, path.join(iconsDir, `icon-${size}x${size}.png`));
}

for (const size of appleSizes) {
  await renderPng(
    standardSvg,
    size,
    path.join(iconsDir, `apple-icon-${size}x${size}.png`),
  );
}

for (const size of [16, 32, 96]) {
  await renderPng(
    standardSvg,
    size,
    path.join(iconsDir, `favicon-${size}x${size}.png`),
  );
}

await renderPng(standardSvg, 192, path.join(iconsDir, "icon-192x192.png"));
await renderPng(maskableSvg, 192, path.join(iconsDir, "android-icon-192x192.png"));
await renderPng(standardSvg, 512, path.join(iconsDir, "icon-512x512.png"));
await renderPng(standardSvg, 180, path.join(iconsDir, "apple-touch-icon.png"));
await renderPng(standardSvg, 180, path.join(iconsDir, "apple-icon-precomposed.png"));
await renderPng(standardSvg, 180, path.join(iconsDir, "apple-icon.png"));

const favicon32 = await sharp(path.join(iconsDir, "favicon-32x32.png")).toBuffer();
await writeFile(path.join(root, "public", "favicon.ico"), favicon32);

console.log("Icons generated in public/assets/icons and public/favicon.ico");
