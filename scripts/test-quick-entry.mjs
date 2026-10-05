// Run: npx tsx scripts/test-quick-entry.mjs
import { parseQuickEntry } from "../src/common/utils/quick-entry.ts";

const cats = [
  { _id: "food", title: "خوراک" },
  { _id: "salary", title: "حقوق" },
  { _id: "transport", title: "حمل و نقل" },
  { _id: "rent", title: "اجاره" },
];
const cases = [
  ["۲۵۰ هزار خوراک ناهار", { amount: 250000, type: "1", categoryId: "food", description: "ناهار" }],
  ["حقوق ۴۵ میلیون", { amount: 45000000, type: "0", categoryId: "salary", description: "" }],
  ["1.5m taxi", { amount: 1500000, type: "1", description: "taxi" }],
  ["۱٬۲۰۰٬۰۰۰ تومان اجاره", { amount: 1200000, type: "1", categoryId: "rent", description: "" }],
  ["درآمد ۳ میلیون پروژه", { amount: 3000000, type: "0", description: "پروژه" }],
  ["اسنپ ۸۵ هزار حمل و نقل", { amount: 85000, type: "1", categoryId: "transport", description: "اسنپ" }],
  ["خرید 250k", { amount: 250000, type: "1", description: "" }],
  ["خوراك ۹۰ هزار", { amount: 90000, type: "1", categoryId: "food", description: "" }],
  ["اقساط", null],
  ["", null],
];
let failed = 0;
for (const [input, expected] of cases) {
  const got = parseQuickEntry(input, cats);
  const ok = expected === null ? got === null : got && Object.entries(expected).every(([k, v]) => got[k] === v);
  if (!ok) failed++;
  console.log(ok ? "✓" : "✗", JSON.stringify(input), "→", JSON.stringify(got));
}
if (failed) { console.error(`${failed} failed`); process.exit(1); }
console.log("All quick-entry tests passed.");
