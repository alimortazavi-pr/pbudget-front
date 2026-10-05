/**
 * "Natural language" quick entry for the command palette:
 *   "۲۵۰ هزار خوراک ناهار"  → expense 250,000 · category خوراک · "ناهار"
 *   "حقوق ۴۵ میلیون"        → income 45,000,000 · category حقوق
 *   "1.5m taxi"             → expense 1,500,000 · "taxi"
 * Nothing is saved: the result only pre-fills the transaction form.
 */

export type QuickEntryCategory = { _id: string; title: string };

export type QuickEntry = {
  amount: number;
  type: "0" | "1";
  categoryId?: string;
  categoryTitle?: string;
  description: string;
};

const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC = "٠١٢٣٤٥٦٧٨٩";

const MULTIPLIERS: [RegExp, number][] = [
  [/^(?:میلیارد|ملیار|b|bn)$/i, 1_000_000_000],
  [/^(?:میلیون|ملیون|م|m|mil|million)$/i, 1_000_000],
  [/^(?:هزار|هزارتومن|الف|ألف|k|thousand)$/i, 1_000],
];

/** Words that mean money came in. Everything else is an expense. */
const INCOME_WORDS = /^(?:درآمد|درامد|دریافت|دریافتی|واریز|حقوق|پاداش|سود|فروش|income|salary|received)$/i;
const NOISE_WORDS = /^(?:تومان|تومن|ت|ریال|toman|tmn|irr|برای|بابت|از|به|و|هزینه|خرج|خرید|پرداخت|expense|for)$/i;

export function normalizeQuickText(text: string) {
  return text
    .replace(/[۰-۹]/g, (d) => String(PERSIAN.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC.indexOf(d)))
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[٬،,](?=\d{3}\b)/g, "") // thousands separators
    .replace(/٫/g, ".")
    .replace(/‌/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseQuickEntry(input: string, categories: QuickEntryCategory[] = []): QuickEntry | null {
  const text = normalizeQuickText(input);
  if (!text) return null;
  const tokens = text.split(" ");

  let amount = 0;
  let amountIndex = -1;
  for (let i = 0; i < tokens.length; i++) {
    // "250k", "1.5m", "45میلیون" glued forms
    const glued = /^(\d+(?:\.\d+)?)([a-zA-Z؀-ۿ]+)?$/.exec(tokens[i]);
    if (!glued) continue;
    let value = Number(glued[1]);
    let consumed = 0;
    const unitWord = glued[2] ?? tokens[i + 1];
    const multiplier = unitWord ? MULTIPLIERS.find(([re]) => re.test(unitWord)) : undefined;
    if (multiplier) {
      value *= multiplier[1];
      if (!glued[2]) consumed = 1;
    } else if (glued[2] && !/^(?:تومان|تومن|ت|toman)$/i.test(glued[2])) {
      continue; // e.g. "2nd" — not an amount
    }
    if (!Number.isFinite(value) || value <= 0) continue;
    amount = Math.round(value);
    amountIndex = i;
    tokens.splice(i, 1 + consumed);
    break;
  }
  if (!amount || amountIndex < 0) return null;

  // Match the category on the full text first: filler words like "و" can be
  // part of a title ("حمل و نقل"). Longest matching title wins.
  let text2 = tokens.join(" ");
  let category: QuickEntryCategory | undefined;
  for (const candidate of categories) {
    const title = normalizeQuickText(candidate.title);
    if (title && text2.includes(title) && (!category || title.length > normalizeQuickText(category.title).length)) {
      category = candidate;
    }
  }
  if (category) text2 = text2.replace(normalizeQuickText(category.title), " ");

  let type: "0" | "1" = "1";
  if (tokens.some((token) => INCOME_WORDS.test(token))) type = "0";
  const description = text2
    .split(" ")
    .filter((token) => token && !INCOME_WORDS.test(token) && !NOISE_WORDS.test(token))
    .join(" ");

  return {
    amount,
    type,
    categoryId: category?._id,
    categoryTitle: category?.title,
    description,
  };
}
