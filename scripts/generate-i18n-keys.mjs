/**
 * Scans src/ for Persian UI strings and emits a key map for bootstrapping i18n.
 * Run: node scripts/generate-i18n-keys.mjs
 */
import fs from "fs";
import path from "path";

const SRC = "src";
const OUT = "scripts/i18n-extracted.json";

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!["node_modules", ".next", "dist"].includes(f)) walk(p, files);
    } else if (/\.(tsx|ts)$/.test(f)) files.push(p);
  }
  return files;
}

function slugify(s) {
  return s
    .replace(/[^\w\u0600-\u06FF\s{}]/g, "")
    .trim()
    .slice(0, 60)
    .replace(/\{\{(\w+)\}\}/g, "_$1_")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
}

const seen = new Map();
let counter = 0;

for (const file of walk(SRC)) {
  if (file.includes("i18n/")) continue;
  const content = fs.readFileSync(file, "utf8");
  const re = /['"`]([^'"`\n]*[\u0600-\u06FF][^'"`\n]*)['"`]/g;
  let m;
  while ((m = re.exec(content))) {
    const s = m[1].trim();
    if (s.length < 2 || s.length > 180 || s.includes("${")) continue;
    if (!seen.has(s)) {
      let key = slugify(s);
      if (!key || /^[0-9a-f_]+$/.test(key) && key.length > 20) {
        key = `str_${++counter}`;
      }
      if ([...seen.values()].includes(key)) key = `${key}_${++counter}`;
      seen.set(s, key);
    }
  }
}

const result = Object.fromEntries(
  [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1])),
);
fs.writeFileSync(OUT, JSON.stringify(result, null, 2), "utf8");
console.log(`Wrote ${Object.keys(result).length} entries to ${OUT}`);
