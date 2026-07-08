import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontRoot = path.join(__dirname, "..");
const mobileRoot = path.join(frontRoot, "..", "pbudget-mobile");
const assetsDir = path.join(frontRoot, "public", "assets");
const sourcePng = path.join(assetsDir, "logo-source.png");

const BRAND_BG = "#5E1B34";
const PRODUCT = {
  bgStops: ["#5E1B34", "#3D1225", "#2A0C1A"],
  accentStops: ["#E8C4A8", "#D4A574", "#B8735C"],
  title: "Paradise Desk",
  subtitle: "Personal finance, budget and daily planning",
  domain: "pdesk.ir",
};

function ogBackgroundSvg() {
  const [c1, c2, c3] = PRODUCT.bgStops;
  const [a1, a2, a3] = PRODUCT.accentStops;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="${c1}"/><stop offset="0.45" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/>
    </linearGradient>
    <linearGradient id="accent" x1="560" y1="420" x2="900" y2="240" gradientUnits="userSpaceOnUse">
      <stop stop-color="${a1}"/><stop offset="0.5" stop-color="${a2}"/><stop offset="1" stop-color="${a3}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="560" y="248" fill="#fff7f9" font-family="Poppins,system-ui,sans-serif" font-size="58" font-weight="700">${PRODUCT.title}</text>
  <text x="562" y="312" fill="#f0d4c4" font-family="Poppins,system-ui,sans-serif" font-size="28" font-weight="500">${PRODUCT.subtitle}</text>
  <text x="562" y="372" fill="#d4a574" font-family="Poppins,system-ui,sans-serif" font-size="24" font-weight="600">${PRODUCT.domain}</text>
  <rect x="560" y="400" width="240" height="6" rx="3" fill="url(#accent)"/>
</svg>`;
}

async function renderIconBuffer(size, pngPath) {
  return sharp(pngPath)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
}

async function renderMaskableIcon(size, pngPath) {
  const inner = Math.round(size * 0.8);
  const logo = await sharp(pngPath)
    .resize(inner, inner, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  const offset = Math.round((size - inner) / 2);
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND_BG,
    },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toBuffer();
}

await mkdir(assetsDir, { recursive: true });

const logoSize = 400;
const logoPng = await renderIconBuffer(logoSize, sourcePng);
const bgPng = await sharp(Buffer.from(ogBackgroundSvg())).resize(1200, 630).png().toBuffer();
await sharp(bgPng)
  .composite([{ input: logoPng, left: 72, top: 115 }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(assetsDir, "og-landing.png"));

for (const [name, size] of [
  ["logo-mark.png", 512],
  ["logo-mark-on-light.png", 512],
]) {
  await sharp(sourcePng)
    .resize(size, size, { fit: "cover", position: "centre" })
    .png()
    .toFile(path.join(assetsDir, name));
}

const maskable512 = await renderMaskableIcon(512, sourcePng);
await sharp(maskable512).toFile(path.join(assetsDir, "logo-mark-maskable.png"));

const mobileAssets = path.join(mobileRoot, "assets");
await mkdir(mobileAssets, { recursive: true });

await copyFile(sourcePng, path.join(mobileAssets, "logo-source.png"));
await copyFile(path.join(assetsDir, "logo-mark.png"), path.join(mobileAssets, "logo-mark.png"));

const appIcon = await sharp(sourcePng)
  .resize(1024, 1024, { fit: "cover", position: "centre" })
  .png()
  .toBuffer();
await sharp(appIcon).toFile(path.join(mobileAssets, "app_icon.png"));

const adaptive = await renderMaskableIcon(1024, sourcePng);
await sharp(adaptive).toFile(path.join(mobileAssets, "app_icon_adaptive.png"));

const webDir = path.join(mobileRoot, "web");
await mkdir(path.join(webDir, "icons"), { recursive: true });
for (const size of [192, 512]) {
  await sharp(appIcon).resize(size, size).png().toFile(path.join(webDir, "icons", `Icon-${size}.png`));
  const maskable = await renderMaskableIcon(size, sourcePng);
  await sharp(maskable).png().toFile(path.join(webDir, "icons", `Icon-maskable-${size}.png`));
}
await sharp(appIcon).resize(48, 48).png().toFile(path.join(webDir, "favicon.png"));

console.log("Brand assets generated from logo-source.png");
