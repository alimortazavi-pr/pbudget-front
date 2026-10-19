// Run: npx tsx scripts/test-sms-parser.mjs
import moment from "moment-jalali";
import {
  learn,
  parse,
  gregorianToJalali,
  jalaliToGregorian,
  sha1Hex,
  matchFormat,
  splitMessages,
} from "../src/common/utils/sms-parser.ts";

let failed = 0;
function check(name, ok, extra = "") {
  if (!ok) failed++;
  console.log(ok ? "✓" : "✗", name, ok ? "" : extra);
}

const RECEIVED = Date.UTC(2026, 9, 19, 9, 0); // fixed receive time
const vectors = [
  {
    name: "cost with trailing minus",
    sms: "بانک نمونه\nبرداشت: 500,000-\nکارت: 6037****1234\nمانده: 2,300,000\n1405/07/27 14:22",
    want: { type: "cost", amountRaw: 500000, amountUnit: "rial", cardLast4: "1234", balance: 2300000, year: 1405, month: 7, day: 27 },
  },
  {
    name: "income, 2-digit year",
    sms: "واریز 1,250,000 ریال\nبه حساب شما\nمانده: 3,550,000 ریال\n05/07/27-09:10",
    want: { type: "income", amountRaw: 1250000, amountUnit: "rial", balance: 3550000, year: 1405, month: 7, day: 27 },
  },
  {
    name: "toman purchase",
    sms: "خرید از فروشگاه X\nمبلغ: 85,000 تومان\nکارت ****9876\n1405/07/20 20:05",
    want: { type: "cost", amountRaw: 85000, amountUnit: "toman", cardLast4: "9876", year: 1405, month: 7, day: 20 },
  },
  { name: "OTP is not a transaction", sms: "رمز پویا 123456 مبلغ 200,000 ریال", want: null },
  {
    name: "sign beats missing keywords",
    sms: "مبلغ 750,000+\nشماره کارت: 5859831012345678",
    want: { type: "income", amountRaw: 750000, cardLast4: "5678" },
  },
];

for (const v of vectors) {
  const learned = v.want ? learn(v.sms, "TEST") : null;
  // A rule set learned from this very sample must parse the sample; the OTP vector uses default rules.
  const rules = learned ? learned.rules : learn("مبلغ: 1,000-", "T").rules;
  const got = parse(v.sms, rules, RECEIVED, "toman", "jalali");
  if (v.want === null) {
    check(v.name, got === null, JSON.stringify(got));
    continue;
  }
  const ok = got && Object.entries(v.want).every(([k, val]) => got[k] === val);
  check(v.name, ok, JSON.stringify(got));
  // The amount is converted to toman for the user: rial / 10.
  if (got && v.want.amountUnit === "rial") check(`${v.name} -> toman`, got.price === v.want.amountRaw / 10, String(got.price));
}

// Rules learned from one sample parse a different SMS of the same bank.
{
  const { rules } = learn("بانک نمونه\nبرداشت: 500,000-\nکارت: 6037****1234\nمانده: 2,300,000\n1405/07/27 14:22", "BANK");
  const got = parse("بانک نمونه\nبرداشت: 1,200,000-\nکارت: 6037****1234\nمانده: 1,100,000\n1405/08/02 10:01", rules, RECEIVED, "toman", "jalali");
  check("same-bank SMS", got && got.type === "cost" && got.amountRaw === 1200000 && got.balance === 1100000 && got.month === 8 && got.day === 2, JSON.stringify(got));
  const ad = parse("بانک نمونه\nوام جدید با سود ویژه، قسط 1,000,000 ریال", rules, RECEIVED);
  check("loan/instalment ad skipped", ad === null);
  const noDate = parse("برداشت: 70,000-", rules, Date.UTC(2026, 9, 19, 9, 0), "toman", "gregorian");
  check("no date -> receive time, gregorian", noDate && !noDate.hasDate && noDate.year === 2026 && noDate.month === 10 && noDate.day === 19, JSON.stringify(noDate));
  const greg = parse("برداشت: 70,000-\n2026/10/19", rules, RECEIVED, "toman", "jalali");
  check("gregorian date -> jalali", greg && greg.year === 1405 && greg.month === 7 && greg.day === 27, JSON.stringify(greg));
}

// Flipping the direction in the learn step.
{
  const l = learn("واریز 1,250,000 ریال\nمانده: 3,550,000 ریال", "S", { type: "cost" });
  const got = parse("واریز 900,000 ریال\nمانده: 1 ریال", l.rules, RECEIVED);
  check("flip income->cost", got && got.type === "cost", JSON.stringify(got));
}

// Picking another number as the amount.
{
  const sample = "خرید 85,000 ریال\nشعبه 4,321 ردیف 77,000";
  const first = learn(sample, "S");
  const other = first.candidates.find((c) => c.value === 77000);
  const l = learn(sample, "S", { amountTokenStart: other.start });
  check("tap another number as amount", l.detected.amount === 77000, JSON.stringify(l.detected));
}

// Calendar conversion against moment-jalali.
{
  let bad = 0;
  for (const [y, m, d] of [[2026, 10, 19], [2024, 3, 20], [2025, 3, 21], [2023, 12, 31], [2000, 1, 1], [2030, 9, 22], [2026, 3, 20]]) {
    const j = gregorianToJalali(y, m, d);
    const ref = moment(`${y}-${m}-${d}`, "YYYY-M-D");
    if (j.year !== ref.jYear() || j.month !== ref.jMonth() + 1 || j.day !== ref.jDate()) bad++;
    const back = jalaliToGregorian(j.year, j.month, j.day);
    if (back.year !== y || back.month !== m || back.day !== d) bad++;
  }
  check("jalali <-> gregorian", bad === 0, `${bad} mismatches`);
}

check("sha1", sha1Hex("abc") === "a9993e364706816aba3e25717850c26c9cd0d89d" && sha1Hex("") === "da39a3ee5e6b4b0d3255bfef95601890afd80709");

{
  const learned = learn("بانک نمونه\nبرداشت: 500,000-", "", { bankName: "بانک نمونه" });
  const fmt = { _id: "1", name: "x", rules: learned.rules, enabled: true };
  check("keyword match", matchFormat([fmt], "", "بانک نمونه\nبرداشت 1,000-") === fmt && matchFormat([fmt], "", "بانک دیگر") === null);
  check("disabled ignored", matchFormat([{ ...fmt, enabled: false }], "", "بانک نمونه") === null);
  check("sender match", matchFormat([{ ...fmt, sender: "3000X", rules: {} }], "3000X", "anything")?.sender === "3000X");
  check("split", splitMessages("a\n\nb\n---\nc").length === 3);
}

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("All SMS parser tests passed.");
