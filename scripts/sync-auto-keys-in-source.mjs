/**
 * Syncs t("auto.*") calls in source with persian-key-map hash keys.
 */
import fs from "fs";
import path from "path";

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!["node_modules", ".next"].includes(f)) walk(p, files);
    } else if (/\.(tsx|ts)$/.test(f)) files.push(p);
  }
  return files;
}

function slugify(s) {
  return s
    .replace(/[^\w\u0600-\u06FF\s]/g, "")
    .trim()
    .slice(0, 55)
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_");
}

const map = JSON.parse(
  fs.readFileSync("src/i18n/persian-key-map.json", "utf8"),
);
const autoFa = fs.readFileSync("src/i18n/messages/fa/auto.ts", "utf8");
const validKeys = new Set(
  [...autoFa.matchAll(/"([^"]+)":/g)].map((m) => m[1]),
);

const slugToKey = {};
const keyToFa = {};
for (const [fa, key] of Object.entries(map)) {
  if (!key.startsWith("auto.")) continue;
  const short = key.slice(5);
  keyToFa[short] = fa;
  slugToKey[slugify(fa)] = short;
  // legacy slug keys stored in map values before normalize
  const legacyShort = key.slice(5);
  slugToKey[legacyShort] = short;
}

let replaced = 0;
for (const file of walk("src")) {
  if (file.includes("/i18n/")) continue;
  let content = fs.readFileSync(file, "utf8");
  let changed = false;

  content = content.replace(/t\(\s*"auto\.([^"]+)"(\s*,[^)]*)?\s*\)/g, (full, keyPart, params = "") => {
    if (validKeys.has(keyPart)) return full;
    const fromSlug = slugToKey[keyPart];
    if (fromSlug && validKeys.has(fromSlug)) {
      replaced++;
      changed = true;
      return `t("auto.${fromSlug}"${params})`;
    }
    return full;
  });

  if (changed) fs.writeFileSync(file, content, "utf8");
}

console.log(`Synced ${replaced} stale auto key references.`);
