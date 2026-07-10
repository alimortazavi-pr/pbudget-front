/**
 * Fixes duplicate auto.* slug collisions by restoring original Persian strings from git HEAD
 * and assigning stable unique keys (auto.k<hash>).
 *
 * Run from pbudget-front: node scripts/fix-auto-key-collisions.mjs
 */
import { execSync } from "child_process";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const ROOT = "src";
const persianRe = /[\u0600-\u06FF]/;

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!["node_modules", ".next"].includes(f)) walk(p, files);
    } else if (/\.(tsx|ts)$/.test(f)) files.push(p);
  }
  return files;
}

function hashKey(fa) {
  const h = crypto.createHash("md5").update(fa).digest("hex").slice(0, 10);
  return `auto.k${h}`;
}

function extractTCalls(content) {
  const re = /t\(\s*"([^"]+)"(?:\s*,\s*[^)]*)?\s*\)/g;
  const out = [];
  let m;
  while ((m = re.exec(content)) !== null) {
    out.push({ start: m.index, end: m.index + m[0].length, str: m[1], full: m[0] });
  }
  return out;
}

let map = {};
try {
  map = JSON.parse(fs.readFileSync("src/i18n/persian-key-map.json", "utf8"));
} catch {
  /* empty */
}

let translations = {};
try {
  translations = JSON.parse(
    fs.readFileSync("scripts/i18n-translations.json", "utf8"),
  );
} catch {
  /* empty */
}

let fixedFiles = 0;
let fixedCalls = 0;
let newKeys = 0;

for (const file of walk(ROOT)) {
  let headContent = "";
  try {
    headContent = execSync(`git show HEAD:${file}`, { encoding: "utf8" });
  } catch {
    continue;
  }

  const current = fs.readFileSync(file, "utf8");
  if (current === headContent) continue;

  const headCalls = extractTCalls(headContent);
  const curCalls = extractTCalls(current);
  if (headCalls.length !== curCalls.length) continue;

  const replacements = [];
  for (let i = 0; i < curCalls.length; i++) {
    const cur = curCalls[i];
    const head = headCalls[i];
    if (cur.str === head.str) continue;
    if (!cur.str.startsWith("auto.")) continue;
    if (!persianRe.test(head.str)) continue;

    const fa = head.str;
    let key = map[fa];
    if (!key || !key.startsWith("auto.")) {
      key = hashKey(fa);
      map[fa] = key;
      newKeys++;
    } else if (key.match(/^auto\._+$/)) {
      key = hashKey(fa);
      map[fa] = key;
      newKeys++;
    }
    if (!translations[fa]) {
      translations[fa] = { en: fa, ar: fa };
    }

    const newFull = cur.full.replace(`"${cur.str}"`, `"${key}"`);
    replacements.push({ start: cur.start, end: cur.end, newFull });
    fixedCalls++;
  }

  if (!replacements.length) continue;

  let next = current;
  for (const r of [...replacements].reverse()) {
    next = next.slice(0, r.start) + r.newFull + next.slice(r.end);
  }
  fs.writeFileSync(file, next, "utf8");
  fixedFiles++;
}

fs.writeFileSync("src/i18n/persian-key-map.json", JSON.stringify(map, null, 2));
fs.writeFileSync(
  "scripts/i18n-translations.json",
  JSON.stringify(translations, null, 2),
);

console.log(
  `Fixed ${fixedCalls} calls in ${fixedFiles} files. New unique keys: ${newKeys}.`,
);
