import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const assetsDir = path.join(root, "public", "assets");

const PRODUCT = {
  bgStops: ["#1e1b4b", "#5b21b6", "#0f766e"],
  accentStops: ["#fb7185", "#c084fc", "#2dd4bf"],
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
  <g opacity="0.07" stroke="#fff" stroke-width="1">
    <path d="M0 105h1200M0 210h1200M0 315h1200M0 420h1200M0 525h1200"/>
    <path d="M120 0v630M240 0v630M360 0v630M480 0v630M600 0v630M720 0v630M840 0v630M960 0v630M1080 0v630"/>
  </g>
  <text x="560" y="248" fill="#fff" font-family="Poppins,system-ui,sans-serif" font-size="58" font-weight="700">${PRODUCT.title}</text>
  <text x="562" y="312" fill="#e9d5ff" font-family="Poppins,system-ui,sans-serif" font-size="28" font-weight="500">${PRODUCT.subtitle}</text>
  <text x="562" y="372" fill="#99f6e4" font-family="Poppins,system-ui,sans-serif" font-size="24" font-weight="600">${PRODUCT.domain}</text>
  <rect x="560" y="400" width="240" height="6" rx="3" fill="url(#accent)"/>
</svg>`;
}

await mkdir(assetsDir, { recursive: true });

const logoMark = path.join(assetsDir, "logo-mark.svg");
const logoSize = 400;
const logoPng = await sharp(logoMark)
  .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const bgPng = await sharp(Buffer.from(ogBackgroundSvg()))
  .resize(1200, 630)
  .png()
  .toBuffer();

const ogPng = path.join(assetsDir, "og-landing.png");

await sharp(bgPng)
  .composite([{ input: logoPng, left: 72, top: 115 }])
  .png({ compressionLevel: 9 })
  .toFile(ogPng);

console.log("Brand assets generated: public/assets/og-landing.png");
