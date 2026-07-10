/**
 * Builds auto.* namespace messages from i18n-translations.json
 * Run: node scripts/build-auto-messages.mjs
 */
import fs from "fs";

const map = JSON.parse(
  fs.readFileSync("src/i18n/persian-key-map.json", "utf8"),
);
const translations = JSON.parse(
  fs.readFileSync("scripts/i18n-translations.json", "utf8"),
);

const autoFa = {};
const autoEn = {};
const autoAr = {};

for (const [fa, key] of Object.entries(map)) {
  if (!key.startsWith("auto.")) continue;
  const short = key.slice(5);
  autoFa[short] = fa;
  autoEn[short] = translations[fa]?.en ?? fa;
  autoAr[short] = translations[fa]?.ar ?? translations[fa]?.en ?? fa;
}

function toTs(obj, varName) {
  const lines = [`export const ${varName}: Record<string, string> = {`];
  for (const [k, v] of Object.entries(obj).sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  }
  lines.push("};", "");
  return lines.join("\n");
}

for (const [lang, data] of [
  ["fa", autoFa],
  ["en", autoEn],
  ["ar", autoAr],
]) {
  const out = `src/i18n/messages/${lang}/auto.ts`;
  fs.writeFileSync(out, toTs(data, "autoMessages"), "utf8");
  console.log(`Wrote ${out} (${Object.keys(data).length} keys)`);
}
