/**
 * Replaces t("Persian") with t("semantic.key") across src/
 * Run: node scripts/build-persian-key-map.mjs && node scripts/migrate-persian-t-calls.mjs
 */
import fs from "fs";
import path from "path";

const map = JSON.parse(
  fs.readFileSync("src/i18n/persian-key-map.json", "utf8"),
);

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!["node_modules", ".next", "i18n/messages"].includes(f)) walk(p, files);
    } else if (/\.tsx$/.test(f)) files.push(p);
  }
  return files;
}

let total = 0;
for (const file of walk("src")) {
  if (file.includes("generated.ts")) continue;
  let content = fs.readFileSync(file, "utf8");
  const orig = content;

  content = content.replace(/t\(\s*"([^"]+)"\s*\)/g, (match, str) => {
    const key = map[str];
    if (!key) return match;
    total++;
    return `t("${key}")`;
  });

  content = content.replace(/t\(\s*'([^']+)'\s*\)/g, (match, str) => {
    const key = map[str];
    if (!key) return match;
    total++;
    return `t('${key}')`;
  });

  if (content !== orig) {
    fs.writeFileSync(file, content, "utf8");
    console.log("Migrated:", file);
  }
}
console.log(`\nReplaced ${total} t() calls.`);
