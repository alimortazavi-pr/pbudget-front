/**
 * Builds auto.* with semantic namespace fallback (no tsx required).
 * Run: node scripts/build-auto-messages.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const map = JSON.parse(
  fs.readFileSync(path.join(root, "src/i18n/persian-key-map.json"), "utf8"),
);
const translations = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/i18n-translations.json"), "utf8"),
);

function flattenTree(obj, prefix, out) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out[full] = value;
    else if (value && typeof value === "object") flattenTree(value, full, out);
  }
}

function loadNamespaceMessages(lang) {
  const dir = path.join(root, `src/i18n/messages/${lang}`);
  const out = {};
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".ts")) continue;
    if (["index.ts", "auto.ts", "generated.ts"].includes(file)) continue;
    const ns = file.replace(/\.ts$/, "");
    const content = fs.readFileSync(path.join(dir, file), "utf8");
    const match = content.match(
      /export const \w+Messages: MessageTree = (\{[\s\S]*?\n\});/,
    );
    if (!match) continue;
    let jsonish = match[1]
      .replace(/([\w]+):/g, '"$1":')
      .replace(/,(\s*[}\]])/g, "$1");
    try {
      const tree = JSON.parse(jsonish);
      flattenTree(tree, ns, out);
    } catch {
      // skip unparseable namespace files
    }
  }
  return out;
}

const faSemantic = loadNamespaceMessages("fa");
const enSemantic = loadNamespaceMessages("en");
const arSemantic = loadNamespaceMessages("ar");

const faToEn = new Map();
const faToAr = new Map();
for (const key of Object.keys(faSemantic)) {
  const fa = faSemantic[key];
  const en = enSemantic[key];
  const ar = arSemantic[key];
  if (en && en !== fa) faToEn.set(fa, en);
  if (ar && ar !== fa) faToAr.set(fa, ar);
}

const faToSemanticKey = new Map();
for (const [fa, semKey] of Object.entries(map)) {
  if (!semKey.startsWith("auto.")) faToSemanticKey.set(fa, semKey);
}

function resolveEn(fa) {
  if (faToEn.has(fa)) return faToEn.get(fa);
  const semKey = faToSemanticKey.get(fa);
  if (semKey && enSemantic[semKey] && enSemantic[semKey] !== fa) {
    return enSemantic[semKey];
  }
  return translations[fa]?.en ?? fa;
}

function resolveAr(fa, en) {
  if (faToAr.has(fa)) return faToAr.get(fa);
  const semKey = faToSemanticKey.get(fa);
  if (semKey && arSemantic[semKey] && arSemantic[semKey] !== fa) {
    return arSemantic[semKey];
  }
  return translations[fa]?.ar ?? translations[fa]?.en ?? en;
}

const autoFa = {};
const autoEn = {};
const autoAr = {};
let enFixed = 0;
let arFixed = 0;

for (const [fa, key] of Object.entries(map)) {
  if (!key.startsWith("auto.")) continue;
  const short = key.slice(5);
  const en = resolveEn(fa);
  const ar = resolveAr(fa, en);
  autoFa[short] = fa;
  autoEn[short] = en;
  autoAr[short] = ar;
  if (en !== fa) enFixed++;
  if (ar !== fa) arFixed++;
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
  const out = path.join(root, `src/i18n/messages/${lang}/auto.ts`);
  fs.writeFileSync(out, toTs(data, "autoMessages"), "utf8");
  console.log(`Wrote ${out} (${Object.keys(data).length} keys)`);
}

console.log(`EN differs from FA: ${enFixed}/${Object.keys(autoFa).length}`);
console.log(`AR differs from FA: ${arFixed}/${Object.keys(autoFa).length}`);
