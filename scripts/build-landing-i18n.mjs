/**
 * Generates landing.ts i18n files from landing-data defaults.
 * Run: node scripts/build-landing-i18n.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const translations = JSON.parse(
  fs.readFileSync(path.join(root, "scripts/i18n-translations.json"), "utf8"),
);

function trEn(fa) {
  return translations[fa]?.en ?? fa;
}

function trAr(fa) {
  return translations[fa]?.ar ?? translations[fa]?.en ?? fa;
}

// Import default content by dynamic import
const { DEFAULT_LANDING_CONTENT } = await import(
  path.join(root, "src/components/pages/landing/landing-data.ts")
);

function buildTree(content) {
  return {
    hero: {
      badge: content.hero.badge,
      title: content.hero.title,
      tagline: content.hero.tagline,
      description: content.hero.description,
      primaryCta: content.hero.primaryCta,
      secondaryCta: content.hero.secondaryCta,
      dashboardCta: "ورود به داشبورد",
      whyTitle: `چرا ${content.hero.title}؟`,
    },
    nav: Object.fromEntries(content.nav.map((n) => [n.id, n.label])),
    stats: Object.fromEntries(
      content.stats.map((s, i) => [
        `s${i}`,
        { value: s.value, label: s.label },
      ]),
    ),
    features: Object.fromEntries(
      content.features.map((f) => [
        f.id,
        { title: f.title, description: f.description, tags: Object.fromEntries(f.tags.map((tag, ti) => [String(ti), tag])) },
      ]),
    ),
    whyUs: Object.fromEntries(
      content.whyUs.map((w, i) => [
        `w${i}`,
        { title: w.title, description: w.description },
      ]),
    ),
    howSteps: Object.fromEntries(
      content.howSteps.map((h, i) => [
        `h${i}`,
        { step: h.step, title: h.title, description: h.description },
      ]),
    ),
    faq: Object.fromEntries(
      content.faq.map((f, i) => [`f${i}`, { q: f.q, a: f.a }]),
    ),
    contact: {
      title: content.contact.title,
      description: content.contact.description,
      emailLabel: "ایمیل",
      telegramLabel: "تلگرام",
      phoneLabel: "تلفن",
    },
    about: {
      title: content.about.title,
      paragraphs: Object.fromEntries(
        content.about.paragraphs.map((p, i) => [String(i), p]),
      ),
    },
    marquee: Object.fromEntries(
      content.marquee.map((m, i) => [String(i), m]),
    ),
    settings: {
      downloadLabel: content.settings.downloadLabel,
    },
    pricing: {
      eyebrow: content.pricing.eyebrow,
      title: content.pricing.title,
      description: content.pricing.description,
      plans: Object.fromEntries(
        content.pricing.plans.map((p) => [
          p.id,
          {
            name: p.name,
            price: p.price,
            period: p.period,
            description: p.description,
            features: Object.fromEntries(
              p.features.map((feat, fi) => [String(fi), feat]),
            ),
            cta: p.cta,
          },
        ]),
      ),
    },
    seo: {
      title: content.seo.title,
      description: content.seo.description,
    },
  };
}

function translateTree(tree, fn) {
  if (typeof tree === "string") return fn(tree);
  if (Array.isArray(tree)) return tree.map((item) => translateTree(item, fn));
  if (tree && typeof tree === "object") {
    const out = {};
    for (const [k, v] of Object.entries(tree)) {
      out[k] = translateTree(v, fn);
    }
    return out;
  }
  return tree;
}

function toTs(tree, varName) {
  return `import type { MessageTree } from "../../types";\n\nexport const ${varName}: MessageTree = ${JSON.stringify(tree, null, 2)};\n`;
}

const faTree = buildTree(DEFAULT_LANDING_CONTENT);

/** Hand-curated EN/AR for hero & high-visibility landing copy */
const EN_OVERRIDES = {
  hero: {
    badge: "2026 — Personal finance",
    title: "Paradise Desk",
    tagline: "Personal finance, projects & daily planning",
    description:
      "The desk that brings personal finance, budgeting, expense analysis, freelance projects and daily planning into one professional experience — built for Iran.",
    primaryCta: "Start free",
    secondaryCta: "Explore features",
    dashboardCta: "Go to dashboard",
    whyTitle: "Why Paradise Desk?",
  },
  nav: {
    features: "Features",
    pricing: "Pricing",
    "why-us": "Why us",
    how: "How it works",
    about: "About",
    faq: "FAQ",
    contact: "Contact",
  },
  contact: {
    title: "Contact us",
    description: "Questions, partnership or support — we're here.",
    emailLabel: "Email",
    telegramLabel: "Telegram",
    phoneLabel: "Phone",
  },
  settings: { downloadLabel: "Download app" },
  pricing: {
    eyebrow: "Transparent pricing",
    title: "Free forever",
    description:
      "All personal finance features are free. No transaction limits, no intrusive ads.",
  },
  seo: {
    title: "Paradise Desk — Personal finance",
    description:
      "Your personal desk for finance, budgeting, expense analysis, freelance projects and daily planning.",
  },
};

const AR_OVERRIDES = {
  hero: {
    badge: "٢٠٢٦ — إدارة مالية شخصية",
    title: "مكتب الجنة",
    tagline: "إدارة مالية شخصية ومشاريع وتخطيط يومي",
    description:
      "المكتب الذي يجمع المالية الشخصية والميزانية وتحليل المصروف ومشاريع العمل الحر والتخطيط اليومي في تجربة احترافية واحدة — مصمم لإيران.",
    primaryCta: "ابدأ مجاناً",
    secondaryCta: "استكشف الميزات",
    dashboardCta: "الذهاب إلى لوحة القيادة",
    whyTitle: "لماذا مكتب الجنة؟",
  },
  nav: {
    features: "الميزات",
    pricing: "الأسعار",
    "why-us": "لماذا نحن",
    how: "كيف يعمل",
    about: "من نحن",
    faq: "الأسئلة",
    contact: "اتصل بنا",
  },
  contact: {
    title: "اتصل بنا",
    description: "أسئلة أو شراكة أو دعم — نحن هنا.",
    emailLabel: "البريد",
    telegramLabel: "تيليجرام",
    phoneLabel: "الهاتف",
  },
  settings: { downloadLabel: "تنزيل التطبيق" },
  pricing: {
    eyebrow: "تسعير شفاف",
    title: "مجاني للأبد",
    description:
      "جميع ميزات الإدارة المالية الشخصية مجانية. بدون حدود للمعاملات وبدون إعلانات مزعجة.",
  },
  seo: {
    title: "مكتب الجنة — إدارة مالية شخصية",
    description:
      "مكتبك الشخصي للمالية والميزانية وتحليل المصروف ومشاريع العمل الحر والتخطيط اليومي.",
  },
};

function deepMerge(base, overrides) {
  const out = { ...base };
  for (const [k, v] of Object.entries(overrides)) {
    if (v && typeof v === "object" && !Array.isArray(v) && typeof base[k] === "object") {
      out[k] = deepMerge(base[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const enTree = deepMerge(translateTree(faTree, trEn), EN_OVERRIDES);
const arTree = deepMerge(translateTree(faTree, trAr), AR_OVERRIDES);

for (const [lang, tree, name] of [
  ["fa", faTree, "landingMessages"],
  ["en", enTree, "landingMessages"],
  ["ar", arTree, "landingMessages"],
]) {
  const out = path.join(root, `src/i18n/messages/${lang}/landing.ts`);
  fs.writeFileSync(out, toTs(tree, name), "utf8");
  console.log(`Wrote ${out}`);
}
