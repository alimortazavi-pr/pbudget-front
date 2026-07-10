/**
 * Scans remaining t("Persian") calls, adds to auto namespace, migrates to semantic keys.
 */
import fs from "fs";
import path from "path";

const translations = JSON.parse(
  fs.readFileSync("scripts/i18n-translations.json", "utf8"),
);
let map = {};
try {
  map = JSON.parse(fs.readFileSync("src/i18n/persian-key-map.json", "utf8"));
} catch {
  /* empty */
}

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!["node_modules", ".next"].includes(f)) walk(p, files);
    } else if (/\.tsx$/.test(f)) files.push(p);
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

const persianRe = /[\u0600-\u06FF]/;
let added = 0;
let replaced = 0;

for (const file of walk("src")) {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;

  content = content.replace(/t\(\s*"([^"]+)"\s*\)/g, (match, str) => {
    if (!persianRe.test(str)) return match;
    if (map[str] && !map[str].startsWith("auto.")) return `t("${map[str]}")`;
    if (map[str]?.startsWith("auto.")) {
      replaced++;
      return `t("${map[str]}")`;
    }

    let slug = slugify(str);
    if (!slug) slug = `s_${added}`;
    let key = `auto.${slug}`;
    let n = 0;
    while (Object.values(map).includes(key)) {
      key = `auto.${slug}_${++n}`;
    }
    map[str] = key;
    if (!translations[str]) {
      translations[str] = { en: str, ar: str };
    }
    added++;
    replaced++;
    changed = true;
    return `t("${key}")`;
  });

  if (changed) fs.writeFileSync(file, content, "utf8");
}

fs.writeFileSync("src/i18n/persian-key-map.json", JSON.stringify(map, null, 2));
fs.writeFileSync(
  "scripts/i18n-translations.json",
  JSON.stringify(translations, null, 2),
);
console.log(`Added ${added} new keys, migrated ${replaced} calls.`);
