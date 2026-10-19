/**
 * Bank SMS parser ("learn from one sample").
 *
 * Pure and dependency-free so the very same logic can be ported to Kotlin
 * (pbudget-native) and checked with the same test vectors
 * (scripts/test-sms-parser.mjs).
 *
 *   learn(sample, sender?)  -> rules + what was detected (for the preview UI)
 *   parse(text, rules, ...) -> a ParsedSms, or null when it is not a transaction
 *
 * The sample text itself is never part of the rules.
 */

export type SmsAmountUnit = "rial" | "toman";
export type SmsKind = "cost" | "income";
export type SmsCurrency = "toman" | "usd" | "dinar";
export type SmsCalendar = "jalali" | "gregorian";

export type SmsRules = {
  v: 1;
  amountUnit: SmsAmountUnit;
  /** Words right before the amount on its line ("" = use the ordinal below / first number). */
  amountLabel: string;
  /** 0-based position of the amount among the non-balance numbers; used only when `amountLabel` is empty. */
  amountIndex?: number;
  costWords: string[];
  incomeWords: string[];
  signCost: string;
  signIncome: string;
  cardLabel: string;
  balanceLabel: string;
  /** Distinctive words that recognise this bank's SMS when there is no sender. */
  keywords: string[];
};

export type SmsToken = {
  start: number;
  end: number;
  text: string;
  value: number;
  /** "+" | "-" | "" */
  sign: string;
  isBalance: boolean;
  /** The words right before the number on its line. */
  label: string;
};

export type SmsDetected = {
  amount: number | null;
  type: SmsKind | null;
  unit: SmsAmountUnit;
  cardLast4: string;
  balance: number | null;
  date: { year: number; month: number; day: number; calendar: SmsCalendar } | null;
  /** [start, end) ranges inside `normalized`, for highlighting. */
  spans: {
    amount?: [number, number];
    balance?: [number, number];
    card?: [number, number];
    date?: [number, number];
  };
};

export type SmsLearnResult = {
  rules: SmsRules;
  detected: SmsDetected;
  candidates: SmsToken[];
  normalized: string;
};

export type SmsLearnOptions = {
  /** Start offset (in the normalized text) of the number the user says is the amount. */
  amountTokenStart?: number;
  /** User correction of income/cost. */
  type?: SmsKind;
  unit?: SmsAmountUnit;
  /** Bank / format name, its words become the recognition keywords. */
  bankName?: string;
};

export type ParsedSms = {
  type: SmsKind;
  /** Number as written in the SMS. */
  amountRaw: number;
  amountUnit: SmsAmountUnit;
  /** Amount in the user's currency unit. */
  price: number;
  cardLast4: string;
  balance: number | null;
  year: number;
  month: number;
  day: number;
  /** false when the SMS has no date and the receive time was used. */
  hasDate: boolean;
  description: string;
  ref: string;
};

export const DEFAULT_COST_WORDS = [
  "برداشت",
  "خرید",
  "پرداخت قبض",
  "پرداخت",
  "انتقال از",
  "کسر",
  "خروج",
  "بدهکار",
  "پایا",
  "ساتنا",
];
export const DEFAULT_INCOME_WORDS = [
  "واریزی",
  "واریز",
  "دریافت",
  "سپرده",
  "افزایش",
  "بستانکار",
  "شارژ",
];
const AMOUNT_LABELS = [
  "مبلغ تراکنش",
  "پرداخت قبض",
  "مبلغ",
  "برداشت",
  "واریز",
  "خرید",
  "پرداخت",
  "انتقال",
];
const BALANCE_LABELS = ["مانده حساب", "باقیمانده", "مانده", "موجودی"];
const NOT_AMOUNT_LABEL_WORDS = [
  "کارمزد",
  "کارت",
  "شماره",
  "پیگیری",
  "رهگیری",
  "مرجع",
  "تلفن",
  "موبایل",
  "شعبه",
  "کد",
];
const GENERIC_WORDS = new Set([
  "بانک",
  "حساب",
  "کارت",
  "مبلغ",
  "برداشت",
  "واریز",
  "خرید",
  "پرداخت",
  "انتقال",
  "مانده",
  "موجودی",
  "شما",
  "از",
  "به",
  "در",
  "با",
  "را",
  "این",
  "برای",
  "شماره",
  "ریال",
  "تومان",
  "پیامک",
]);

// ---------------------------------------------------------------- normalize

const DIGIT_MAP: Record<string, string> = {};
"۰۱۲۳۴۵۶۷۸۹".split("").forEach((d, i) => (DIGIT_MAP[d] = String(i)));
"٠١٢٣٤٥٦٧٨٩".split("").forEach((d, i) => (DIGIT_MAP[d] = String(i)));

/** Persian/Arabic digits to ASCII, invisible marks removed, Arabic letters unified, separators simplified. */
export function normalizeSms(input: string): string {
  return input
    .replace(/[۰-۹٠-٩]/g, (d) => DIGIT_MAP[d] ?? d)
    .replace(/[‌‍‎‏]/g, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[٬،]/g, ",")
    .replace(/٫/g, ".")
    .replace(/\r\n?/g, "\n");
}

// ------------------------------------------------------------------ tokens

const NUMBER_SOURCE =
  "[+\\-−]?\\s?\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?[+\\-−]?|[+\\-−]?\\d{4,}(?:\\.\\d+)?[+\\-−]?";
const IGNORED_SOURCES = [
  "\\d{2,4}/\\d{1,2}/\\d{1,2}",
  "\\d{4}-\\d{1,2}-\\d{1,2}",
  "\\d{1,2}:\\d{2}(?::\\d{2})?",
  "[*xX•#]{2,}\\s?\\d{4}",
  "\\d{4}[*xX•#]{2,}(?:\\d{4})?",
  "\\d{4}-\\d{4}(?:-\\d{4}){0,2}",
];

function lineStartOf(text: string, index: number): number {
  return text.lastIndexOf("\n", index - 1) + 1;
}

function lineEndOf(text: string, index: number): number {
  const end = text.indexOf("\n", index);
  return end === -1 ? text.length : end;
}

function cleanLabel(raw: string): string {
  return raw.replace(/[\s:：\-–]+$/g, "").replace(/^[\s:：\-–]+/g, "");
}

function labelEndingWith(pre: string, labels: string[]): string {
  const clean = cleanLabel(pre);
  for (const label of labels) {
    if (clean.endsWith(label)) return label;
  }
  return "";
}

function guessLabel(pre: string): string {
  const clean = cleanLabel(pre);
  if (!clean) return "";
  const known = labelEndingWith(pre, AMOUNT_LABELS);
  if (known) return known;
  return clean.split(/\s+/).slice(-2).join(" ");
}

/** Every number in the text that can be an amount or a balance, in order. */
export function findNumberTokens(normalized: string): SmsToken[] {
  const ignored: Array<[number, number]> = [];
  for (const source of IGNORED_SOURCES) {
    const re = new RegExp(source, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(normalized))) ignored.push([m.index, m.index + m[0].length]);
  }

  const tokens: SmsToken[] = [];
  const re = new RegExp(NUMBER_SOURCE, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(normalized))) {
    const raw = m[0];
    let start = m.index;
    const end = m.index + raw.length;
    // A leading space belongs to the sign, not to the token.
    if (/^\s/.test(raw)) start += raw.length - raw.trimStart().length;
    const digits = raw.replace(/\D/g, "");
    if (digits.replace(/^0+/, "").length > 13 || digits.length > 13) continue;
    if (ignored.some(([a, b]) => start < b && end > a)) continue;

    const trimmed = raw.trim();
    let sign = "";
    if (/^[+\-−]/.test(trimmed)) sign = trimmed[0];
    else if (/[+\-−]$/.test(trimmed)) sign = trimmed[trimmed.length - 1];
    if (sign === "−") sign = "-";

    const value = Number(trimmed.replace(/[+\-−\s,]/g, ""));
    if (!Number.isFinite(value)) continue;

    const pre = normalized.slice(lineStartOf(normalized, start), start);
    const balanceLabel = labelEndingWith(pre, BALANCE_LABELS);
    tokens.push({
      start,
      end,
      text: normalized.slice(start, end).trim(),
      value,
      sign,
      isBalance: Boolean(balanceLabel),
      label: balanceLabel || guessLabel(pre),
    });
  }
  return tokens;
}

function isIdLike(token: SmsToken): boolean {
  if (token.isBalance) return false;
  if (AMOUNT_LABELS.some((label) => token.label.includes(label))) return false;
  return NOT_AMOUNT_LABEL_WORDS.some((word) => token.label.split(/\s+/).includes(word));
}

function amountCandidates(tokens: SmsToken[]): SmsToken[] {
  return tokens.filter((token) => !token.isBalance && !isIdLike(token));
}

function hasAmountLabel(token: SmsToken): boolean {
  return AMOUNT_LABELS.some((label) => token.label.endsWith(label)) && !token.label.includes("کارمزد");
}

function pickBestToken(candidates: SmsToken[]): SmsToken | null {
  const labelled = candidates.find(hasAmountLabel);
  if (labelled) return labelled;
  const withSeparators = candidates.find((token) => token.text.includes(",") || token.sign);
  return withSeparators ?? candidates[0] ?? null;
}

// -------------------------------------------------------------------- dates

function div(a: number, b: number) {
  return Math.trunc(a / b);
}
function mod(a: number, n: number) {
  return a - n * Math.floor(a / n);
}

const JALALI_BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178,
];

function jalCal(jy: number, withoutLeap: boolean) {
  const bl = JALALI_BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = JALALI_BREAKS[0];
  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    const jm = JALALI_BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (withoutLeap) return { gy, march, leap: 0 };
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number) {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy, true);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy, false);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

export function jalaliToGregorian(jy: number, jm: number, jd: number) {
  const g = d2g(j2d(jy, jm, jd));
  return { year: g.gy, month: g.gm, day: g.gd };
}

export function gregorianToJalali(gy: number, gm: number, gd: number) {
  const j = d2j(g2d(gy, gm, gd));
  return { year: j.jy, month: j.jm, day: j.jd };
}

type DateParts = { year: number; month: number; day: number };

function dateFromMillis(ms: number, calendar: SmsCalendar): DateParts {
  const d = new Date(ms);
  const g = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  return calendar === "gregorian" ? g : gregorianToJalali(g.year, g.month, g.day);
}

type FoundDate = { parts: DateParts; calendar: SmsCalendar; span: [number, number] };

function findDate(normalized: string, receivedAtMs: number): FoundDate | null {
  const full = /(\d{4}|\d{2})([/])(\d{1,2})\2(\d{1,2})|(\d{4})-(\d{1,2})-(\d{1,2})/.exec(normalized);
  if (full) {
    const y = Number(full[1] ?? full[5]);
    const mo = Number(full[3] ?? full[6]);
    const d = Number(full[4] ?? full[7]);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      let year = y;
      if (year < 100) {
        // "05" -> 1405 (and "99" -> 1399 when 1499 would be in the future).
        const nowJalali = dateFromMillis(receivedAtMs, "jalali").year;
        year = 1400 + year;
        if (year > nowJalali + 1) year -= 100;
      }
      return {
        parts: { year, month: mo, day: d },
        calendar: year < 1700 ? "jalali" : "gregorian",
        span: [full.index, full.index + full[0].length],
      };
    }
  }
  const short = /(?<![\d/])(\d{1,2})\/(\d{1,2})(?![\d/:])/.exec(normalized);
  if (short) {
    const mo = Number(short[1]);
    const d = Number(short[2]);
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      const year = dateFromMillis(receivedAtMs, "jalali").year;
      return {
        parts: { year, month: mo, day: d },
        calendar: "jalali",
        span: [short.index, short.index + short[0].length],
      };
    }
  }
  return null;
}

function inCalendar(found: FoundDate, target: SmsCalendar): DateParts {
  if (found.calendar === target) return found.parts;
  const { year, month, day } = found.parts;
  return target === "jalali" ? gregorianToJalali(year, month, day) : jalaliToGregorian(year, month, day);
}

// -------------------------------------------------------------------- card

function findCard(normalized: string, label: string): { last4: string; span: [number, number] } | null {
  const patterns: RegExp[] = [
    /\d{4}[ \-]\d{4}[ \-]\d{4}[ \-]\d{4}/,
    /(?<!\d)\d{16}(?!\d)/,
    /\d{4}[*xX•#.\-]{2,}(\d{4})(?!\d)/,
    /[*xX•#]{2,}\s?(\d{4})(?!\d)/,
  ];
  for (const re of patterns) {
    const m = re.exec(normalized);
    if (m) {
      const digits = (m[1] ?? m[0].replace(/\D/g, "")).slice(-4);
      return { last4: digits, span: [m.index, m.index + m[0].length] };
    }
  }
  const labels = [label, "شماره کارت", "کارت"].filter(Boolean);
  for (const l of labels) {
    const idx = normalized.indexOf(l);
    if (idx === -1) continue;
    const rest = normalized.slice(idx + l.length, lineEndOf(normalized, idx));
    const m = /^\s*[:：]?\s*(\d{4,16})(?!\d)/.exec(rest);
    if (m) {
      const start = idx + l.length + rest.indexOf(m[1]);
      return { last4: m[1].slice(-4), span: [start, start + m[1].length] };
    }
  }
  return null;
}

// -------------------------------------------------------------------- type

function earliest(normalized: string, words: string[]): { index: number; word: string } | null {
  let best: { index: number; word: string } | null = null;
  for (const word of words) {
    if (!word) continue;
    const index = normalized.indexOf(word);
    if (index === -1) continue;
    if (!best || index < best.index || (index === best.index && word.length > best.word.length)) {
      best = { index, word };
    }
  }
  return best;
}

function decideType(normalized: string, sign: string, rules: SmsRules): SmsKind | null {
  if (sign) {
    if (rules.signCost && sign === rules.signCost) return "cost";
    if (rules.signIncome && sign === rules.signIncome) return "income";
  }
  const cost = earliest(normalized, rules.costWords);
  const income = earliest(normalized, rules.incomeWords);
  if (cost && income) {
    if (cost.index !== income.index) return cost.index < income.index ? "cost" : "income";
    return cost.word.length >= income.word.length ? "cost" : "income";
  }
  if (cost) return "cost";
  if (income) return "income";
  return null;
}

// -------------------------------------------------------------------- learn

function detectUnit(normalized: string): SmsAmountUnit {
  if (normalized.includes("ریال")) return "rial";
  if (normalized.includes("تومان")) return "toman";
  return "rial";
}

function uniq(words: string[]): string[] {
  return Array.from(new Set(words.filter(Boolean)));
}

function pickKeywords(normalized: string, bankName?: string): string[] {
  const words = (source: string) =>
    uniq(
      source
        .replace(/[0-9۰-۹*:：,.\-+/]/g, " ")
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 3 && !GENERIC_WORDS.has(w) && /[\u0600-\u06FFa-zA-Z]/.test(w)),
    );
  // Words of the bank's name, but only those the SMS really contains (they are what recognises it later).
  const fromName = words(bankName ?? "").filter((w) => normalized.includes(w));
  if (fromName.length) return fromName.slice(0, 3);
  const firstLine = normalized.split("\n").find((line) => line.trim()) ?? "";
  return words(firstLine).slice(0, 3);
}

export function learn(sampleText: string, senderAddress?: string, options: SmsLearnOptions = {}): SmsLearnResult {
  void senderAddress;
  const normalized = normalizeSms(sampleText);
  const tokens = findNumberTokens(normalized);
  const candidates = amountCandidates(tokens);

  let chosen: SmsToken | null = null;
  if (options.amountTokenStart != null) {
    chosen = tokens.find((token) => token.start === options.amountTokenStart && !token.isBalance) ?? null;
  }
  if (!chosen) chosen = pickBestToken(candidates);

  const unit = options.unit ?? detectUnit(normalized);
  const costFound = DEFAULT_COST_WORDS.filter((w) => normalized.includes(w));
  const incomeFound = DEFAULT_INCOME_WORDS.filter((w) => normalized.includes(w));

  let signCost = "";
  let signIncome = "";
  if (chosen?.sign) {
    signCost = "-";
    signIncome = "+";
  }

  let costWords = uniq([...costFound, ...DEFAULT_COST_WORDS]);
  let incomeWords = uniq([...incomeFound, ...DEFAULT_INCOME_WORDS]);

  const baseRules: SmsRules = {
    v: 1,
    amountUnit: unit,
    amountLabel: chosen ? guessLabel(normalized.slice(lineStartOf(normalized, chosen.start), chosen.start)) : "",
    costWords,
    incomeWords,
    signCost,
    signIncome,
    cardLabel: "",
    balanceLabel: "",
    keywords: pickKeywords(normalized, options.bankName),
  };
  if (chosen && !baseRules.amountLabel) {
    baseRules.amountIndex = candidates.findIndex((token) => token.start === chosen.start);
    if (baseRules.amountIndex < 0) delete baseRules.amountIndex;
  }

  let type = chosen ? decideType(normalized, chosen.sign, baseRules) : null;

  // The user flipped income/cost: swap the signs and move the sample's words to the other side.
  if (options.type && type && options.type !== type) {
    const swap = (from: string[], to: string[], found: string[]) => ({
      from: from.filter((w) => !found.includes(w)),
      to: uniq([...found, ...to]),
    });
    if (type === "cost") {
      const moved = swap(costWords, incomeWords, costFound);
      costWords = moved.from;
      incomeWords = moved.to;
    } else {
      const moved = swap(incomeWords, costWords, incomeFound);
      incomeWords = moved.from;
      costWords = moved.to;
    }
    baseRules.costWords = costWords;
    baseRules.incomeWords = incomeWords;
    if (chosen?.sign) {
      baseRules.signCost = "+";
      baseRules.signIncome = "-";
    }
    type = options.type;
  } else if (options.type && !type) {
    // No sign or word to learn from: the chosen direction becomes the rule for the amount's label.
    if (options.type === "cost") baseRules.costWords = uniq([baseRules.amountLabel, ...costWords]);
    else baseRules.incomeWords = uniq([baseRules.amountLabel, ...incomeWords]);
    type = options.type;
  }

  const card = findCard(normalized, "");
  if (card) {
    const pre = normalized.slice(lineStartOf(normalized, card.span[0]), card.span[0]);
    baseRules.cardLabel = labelEndingWith(pre, ["شماره کارت", "شماره حساب", "کارت", "حساب"]);
  }

  const balanceToken = tokens.find((token) => token.isBalance);
  if (balanceToken) baseRules.balanceLabel = balanceToken.label;

  const found = findDate(normalized, Date.now());

  const detected: SmsDetected = {
    amount: chosen ? chosen.value : null,
    type,
    unit,
    cardLast4: card?.last4 ?? "",
    balance: balanceToken ? balanceToken.value : null,
    date: found
      ? { ...found.parts, calendar: found.calendar }
      : null,
    spans: {
      amount: chosen ? [chosen.start, chosen.end] : undefined,
      balance: balanceToken ? [balanceToken.start, balanceToken.end] : undefined,
      card: card?.span,
      date: found?.span,
    },
  };

  return { rules: baseRules, detected, candidates: tokens.filter((t) => !t.isBalance), normalized };
}

// -------------------------------------------------------------------- parse

const OTP_RE = /رمز|OTP|(?<![؀-ۿ])کد(?![؀-ۿ])(?!\s*(?:پیگیری|رهگیری|مرجع|ملی|شعبه))/i;

/** Accept rules coming back from the server (any shape) and fill the gaps. */
export function coerceRules(raw: unknown): SmsRules {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<SmsRules>;
  const list = (value: unknown, fallback: string[]) =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : fallback;
  return {
    v: 1,
    amountUnit: r.amountUnit === "toman" ? "toman" : "rial",
    amountLabel: typeof r.amountLabel === "string" ? r.amountLabel : "",
    amountIndex: typeof r.amountIndex === "number" ? r.amountIndex : undefined,
    costWords: list(r.costWords, DEFAULT_COST_WORDS),
    incomeWords: list(r.incomeWords, DEFAULT_INCOME_WORDS),
    signCost: typeof r.signCost === "string" ? r.signCost : "",
    signIncome: typeof r.signIncome === "string" ? r.signIncome : "",
    cardLabel: typeof r.cardLabel === "string" ? r.cardLabel : "",
    balanceLabel: typeof r.balanceLabel === "string" ? r.balanceLabel : "",
    keywords: list(r.keywords, []),
  };
}

function locateAmount(normalized: string, tokens: SmsToken[], rules: SmsRules): SmsToken | null {
  const candidates = tokens.filter((token) => !token.isBalance);
  if (!candidates.length) return null;

  if (rules.amountLabel) {
    let from = normalized.indexOf(rules.amountLabel);
    while (from !== -1) {
      const labelEnd = from + rules.amountLabel.length;
      const lineEnd = lineEndOf(normalized, labelEnd);
      const hit = candidates.find((token) => token.start >= labelEnd && token.start <= lineEnd);
      if (hit) return hit;
      from = normalized.indexOf(rules.amountLabel, from + 1);
    }
  } else if (typeof rules.amountIndex === "number") {
    const usable = amountCandidates(tokens);
    if (usable[rules.amountIndex]) return usable[rules.amountIndex];
  }
  return pickBestToken(amountCandidates(tokens)) ?? candidates[0];
}

/** Hex SHA-1 of a string (UTF-8). Synchronous so the same code runs in the receiver on Android. */
export function sha1Hex(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i += 1) words[i >> 2] |= bytes[i] << (24 - (i % 4) * 8);
  const bitLength = bytes.length * 8;
  words[bitLength >> 5] |= 0x80 << (24 - (bitLength % 32));
  words[(((bitLength + 64) >> 9) << 4) + 15] = bitLength;
  const rotl = (n: number, s: number) => (n << s) | (n >>> (32 - s));
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;
  const w = new Array<number>(80);
  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 80; t += 1) {
      w[t] = t < 16 ? (words[i + t] ?? 0) : rotl(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    for (let t = 0; t < 80; t += 1) {
      let f: number;
      let k: number;
      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (rotl(a, 5) + f + e + k + w[t]) | 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = temp;
    }
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }
  return [h0, h1, h2, h3, h4].map((h) => (h >>> 0).toString(16).padStart(8, "0")).join("");
}

/** Stable id of an SMS: re-importing the same message is harmless server-side. */
export function buildSmsRef(sender: string, receivedAtMs: number, normalizedBody: string): string {
  return `sms:${sha1Hex(`${sender}|${receivedAtMs}|${normalizedBody}`)}`;
}

export function parse(
  text: string,
  rules: SmsRules,
  receivedAtMs: number,
  userCurrency: SmsCurrency = "toman",
  userCalendar: SmsCalendar = "jalali",
  options: { sender?: string; sourceName?: string } = {},
): ParsedSms | null {
  const normalized = normalizeSms(text);
  if (!normalized.trim()) return null;
  if (OTP_RE.test(normalized)) return null;
  if (normalized.includes("قسط")) return null;

  const tokens = findNumberTokens(normalized);
  const amountToken = locateAmount(normalized, tokens, rules);
  if (!amountToken || amountToken.value <= 0) return null;

  const type = decideType(normalized, amountToken.sign, rules);
  if (!type) return null; // not a transaction (ad, loan reminder, notice...)

  const factor = userCurrency === "toman" ? (rules.amountUnit === "rial" ? 0.1 : 1) : 1;
  const price = Number((amountToken.value * factor).toFixed(2));

  const balanceToken =
    (rules.balanceLabel
      ? tokens.find((token) => token.isBalance && token.label === rules.balanceLabel)
      : undefined) ?? tokens.find((token) => token.isBalance);

  const card = findCard(normalized, rules.cardLabel);

  const found = findDate(normalized, receivedAtMs);
  const parts = found ? inCalendar(found, userCalendar) : dateFromMillis(receivedAtMs, userCalendar);

  return {
    type,
    amountRaw: amountToken.value,
    amountUnit: rules.amountUnit,
    price,
    cardLast4: card?.last4 ?? "",
    balance: balanceToken ? balanceToken.value : null,
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hasDate: Boolean(found),
    description: `${options.sourceName?.trim() || "پیامک"} · پیامک`,
    ref: buildSmsRef(options.sender ?? "", receivedAtMs, normalized),
  };
}

// ------------------------------------------------------------------ formats

export type SmsFormatLike = {
  _id: string;
  name: string;
  sender?: string;
  bankName?: string;
  rules: unknown;
  enabled?: boolean;
};

/** Exact sender first; a format without sender needs all its keywords in the text. Disabled formats never match. */
export function matchFormat<T extends SmsFormatLike>(formats: T[], sender: string, text: string): T | null {
  const enabled = formats.filter((f) => f.enabled !== false);
  const bySender = sender ? enabled.find((f) => f.sender && f.sender.trim() === sender.trim()) : undefined;
  if (bySender) return bySender;
  const normalized = normalizeSms(text);
  return (
    enabled.find((f) => {
      if (f.sender && f.sender.trim()) return false;
      const keywords = coerceRules(f.rules).keywords;
      return keywords.length > 0 && keywords.every((k) => normalized.includes(k));
    }) ?? null
  );
}

/** Splits pasted text into separate messages (blank line or --- between them). */
export function splitMessages(pasted: string): string[] {
  return pasted
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n+|\n\s*[-=_]{3,}\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Short Persian description of what was understood: "خرج ۵۰۰٬۰۰۰ تومان — کارت ****۱۲۳۴". */
export function summarizeKind(type: SmsKind): string {
  return type === "cost" ? "خرج" : "درآمد";
}
