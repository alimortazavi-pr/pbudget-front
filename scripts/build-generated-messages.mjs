/**
 * Builds generated message maps keyed by Persian source strings.
 * Run: node scripts/build-generated-messages.mjs
 */
import fs from "fs";

const extracted = JSON.parse(
  fs.readFileSync("scripts/i18n-extracted.json", "utf8"),
);

/** Persian → { en, ar } for bulk UI strings */
const translations = JSON.parse(
  fs.readFileSync("scripts/i18n-translations.json", "utf8"),
);

function escapeTs(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildLang(lang) {
  const lines = ['export const generatedMessages: Record<string, string> = {'];
  for (const fa of Object.keys(extracted).sort()) {
    const entry = translations[fa];
    const value =
      lang === "fa"
        ? fa
        : entry?.[lang] ?? entry?.en ?? fa;
    lines.push(`  "${escapeTs(fa)}": "${escapeTs(value)}",`);
  }
  lines.push("};");
  lines.push("");
  return lines.join("\n");
}

for (const lang of ["fa", "en", "ar"]) {
  const out = `src/i18n/messages/${lang}/generated.ts`;
  fs.writeFileSync(out, buildLang(lang), "utf8");
  console.log(`Wrote ${out}`);
}
