/**
 * Smoke tests for i18n coverage (no browser required).
 * Run: node --experimental-strip-types scripts/test-i18n.mjs
 */
import { allMessages } from "../src/i18n/messages/index.ts";

const { fa, en, ar } = allMessages;

const checks = [
  { key: "pageHero.notes.description", enNeedle: "Free-form", arNeedle: "نص حر" },
  { key: "brand.tagline", enNeedle: "Personal finance", arNeedle: "إدارة مالية" },
  { key: "download.headline", enNeedle: "Financial desk", arNeedle: "مكتب مالي" },
  { key: "pages.debts.filterOpen", enNeedle: "Open", arNeedle: "مفتوح" },
  { key: "landing.hero.tagline", enNeedle: "Personal finance", arNeedle: "إدارة مالية" },
];

let failed = 0;
for (const { key, enNeedle, arNeedle } of checks) {
  const faVal = fa[key];
  const enVal = en[key];
  const arVal = ar[key];
  if (!faVal || !enVal || !arVal) {
    console.error(`✗ missing key ${key}`);
    failed++;
    continue;
  }
  if (enVal === faVal) {
    console.error(`✗ EN still equals FA for ${key}`);
    failed++;
  } else if (!enVal.includes(enNeedle)) {
    console.error(`✗ EN mismatch for ${key}: ${enVal}`);
    failed++;
  } else if (!arVal.includes(arNeedle)) {
    console.error(`✗ AR mismatch for ${key}: ${arVal}`);
    failed++;
  } else {
    console.log(`✓ ${key}`);
  }
}

let enSame = 0;
let autoCount = 0;
for (const [k, v] of Object.entries(fa)) {
  if (!k.startsWith("auto.")) continue;
  autoCount++;
  if (en[k] === v) enSame++;
}
const ratio = ((autoCount - enSame) / autoCount) * 100;
console.log(
  `auto.en translated: ${ratio.toFixed(1)}% (${autoCount - enSame}/${autoCount})`,
);

if (ratio < 40) {
  console.error("✗ auto.en translation ratio below 40%");
  failed++;
}

if (failed > 0) {
  console.error(`\n${failed} i18n smoke test(s) failed`);
  process.exit(1);
}

console.log("\nAll i18n smoke tests passed.");
