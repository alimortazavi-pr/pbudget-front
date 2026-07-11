/**
 * Wraps hardcoded Persian UI strings with t("key"). Safe: only Persian-dominant literals.
 * Run: node scripts/codemod-all-persian.mjs && node scripts/scan-and-migrate-remaining.mjs && npm run i18n:auto
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");

const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "i18n"]);
const SKIP_FILES = new Set([
  "iran-jalali-holidays.data.ts",
  "landing-data.ts",
  "tours.ts",
  "generated.ts",
  "persian-digits.ts",
  "brand.ts",
  "products.ts",
  "experience.ts",
  "app-version.ts",
  "URL.ts",
]);

const persianCharRe = /[\u0600-\u06FF\u200c]/g;

let map = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/i18n/persian-key-map.json"), "utf8"),
);
let translations = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts/i18n-translations.json"), "utf8"),
);

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!SKIP_DIRS.has(f)) walk(p, files);
    } else if (/\.(tsx|ts)$/.test(f) && !SKIP_FILES.has(f)) {
      files.push(p);
    }
  }
  return files;
}

function hashKey(fa) {
  return crypto.createHash("sha1").update(fa).digest("hex").slice(0, 10);
}

function resolveKey(fa) {
  if (map[fa] && !map[fa].startsWith("auto.")) return map[fa];
  if (map[fa]?.startsWith("auto.")) return map[fa];
  const key = `auto.k${hashKey(fa)}`;
  map[fa] = key;
  if (!translations[fa]) translations[fa] = { en: fa, ar: fa };
  return key;
}

function isPersianDominant(str) {
  if (!str || str.length < 1) return false;
  const persian = (str.match(persianCharRe) || []).length;
  const significant = str.replace(/[\s\d\W]/g, "").length || str.length;
  if (persian === 0) return false;
  // Must have meaningful Persian content, not a single char mixed in ASCII
  if (persian < 2 && significant > persian + 3) return false;
  return persian / significant >= 0.35;
}

function isInsideComment(content, index) {
  const before = content.slice(0, index);
  const lineStart = before.lastIndexOf("\n") + 1;
  if (before.slice(lineStart).includes("//")) return true;
  const lastBlock = before.lastIndexOf("/*");
  const lastBlockEnd = before.lastIndexOf("*/");
  return lastBlock > lastBlockEnd;
}

function shouldSkipString(str, before) {
  if (!isPersianDominant(str)) return true;
  if (str.length > 400) return true;
  if (str.includes("${")) return true;
  if (
    str.startsWith("auto.") ||
    str.startsWith("nav.") ||
    str.startsWith("common.") ||
    str.startsWith("admin.") ||
    str.startsWith("errors.")
  )
    return true;
  if (/^https?:\/\//.test(str) || /^tel:/.test(str)) return true;
  if (before.endsWith("t(") || before.endsWith("t (")) return true;
  if (before.match(/import\s+.*from\s*$/)) return true;
  return false;
}

function isJsxAttributeValue(content, offset) {
  const before = content.slice(Math.max(0, offset - 120), offset);
  return /\b[\w.-]+\s*=\s*$/.test(before);
}

function wrapTranslation(key, quote, inJsxAttr) {
  const call = `t(${quote}${key}${quote})`;
  return inJsxAttr ? `{${call}}` : call;
}

function hasHook(content) {
  return /const\s*\{\s*t\s*\}\s*=\s*useTranslation/.test(content);
}

function addClientImport(content) {
  const importLine =
    'import { useTranslation } from "@/components/providers/LanguageProvider";\n';
  if (content.includes("useTranslation")) return content;
  if (content.includes('from "@/components/providers/LanguageProvider"')) {
    return content.replace(
      /import\s*\{([^}]+)\}\s*from\s*"@\/components\/providers\/LanguageProvider"/,
      (_m, imports) => {
        const parts = imports.split(",").map((s) => s.trim()).filter(Boolean);
        if (!parts.includes("useTranslation")) parts.push("useTranslation");
        return `import { ${parts.join(", ")} } from "@/components/providers/LanguageProvider"`;
      },
    );
  }
  if (content.startsWith('"use client"')) {
    return content.replace('"use client";\n', `"use client";\n\n${importLine}`);
  }
  return `${importLine}${content}`;
}

function addHook(content) {
  if (hasHook(content)) return content;
  const fnMatch = content.match(/export function (\w+)\([^)]*\)\s*\{/);
  if (fnMatch) {
    const idx = content.indexOf(fnMatch[0]) + fnMatch[0].length;
    return (
      content.slice(0, idx) +
      "\n  const { t } = useTranslation();" +
      content.slice(idx)
    );
  }
  const arrowMatch = content.match(
    /export (?:const|function) (\w+)[^=]*=\s*\([^)]*\)\s*=>\s*\{/,
  );
  if (arrowMatch) {
    const idx = content.indexOf(arrowMatch[0]) + arrowMatch[0].length;
    return (
      content.slice(0, idx) +
      "\n  const { t } = useTranslation();" +
      content.slice(idx)
    );
  }
  return content;
}

function addGetTranslator(content) {
  const importLine = 'import { getTranslator } from "@/i18n";\n';
  const hookLine = "const t = getTranslator();\n";
  if (content.includes("getTranslator")) return content;
  if (content.startsWith('"use client"')) {
    return content.replace('"use client";\n', `"use client";\n\n${importLine}${hookLine}`);
  }
  return `${importLine}${hookLine}${content}`;
}

function transformFile(filePath) {
  const isTsx = filePath.endsWith(".tsx");
  const isTs = filePath.endsWith(".ts");

  let content = fs.readFileSync(filePath, "utf8");
  if (!persianCharRe.test(content)) return false;
  const orig = content;
  let needsT = false;

  content = content.replace(
    /(["'`])((?:[^"'\\]|\\.)*)\1/g,
    (match, quote, str, offset) => {
      const before = content.slice(Math.max(0, offset - 30), offset);
      if (shouldSkipString(str, before) || isInsideComment(content, offset)) {
        return match;
      }
      needsT = true;
      const inJsxAttr = isTsx && isJsxAttributeValue(content, offset);
      return wrapTranslation(resolveKey(str), quote, inJsxAttr);
    },
  );

  if (isTsx) {
    content = content.replace(
      />([^<>{}\n]*[\u0600-\u06FF\u200c][^<>{}\n]*)</g,
      (match, text) => {
        const trimmed = text.trim();
        if (!isPersianDominant(trimmed) || trimmed.includes("t(")) return match;
        needsT = true;
        return `>{t(${JSON.stringify(resolveKey(trimmed))})}<`;
      },
    );

    // Indented Persian-only JSX text lines (multiline)
    content = content.replace(
      /^(\s+)([\u0600-\u06FF\u200c][^\n<{]*[\u0600-\u06FF\u200c][^\n<{}]*)$/gm,
      (match, indent, text) => {
        const trimmed = text.trim();
        if (!isPersianDominant(trimmed) || trimmed.includes("t(")) return match;
        needsT = true;
        return `${indent}{t(${JSON.stringify(resolveKey(trimmed))})}`;
      },
    );

    // Trailing Persian after JSX expression: `} تومان` or `} word`
    content = content.replace(
      /(\})\s+([\u0600-\u06FF\u200c]+)(\s*)$/gm,
      (match, exprEnd, persian, tail) => {
        const word = persian.trim();
        if (!isPersianDominant(word)) return match;
        needsT = true;
        if (word === "تومان") {
          return `${exprEnd} {t("common.toman")}${tail}`;
        }
        return `${exprEnd} {t(${JSON.stringify(resolveKey(word))})}${tail}`;
      },
    );

    // `${expr} تومان` → `${expr} ${t("common.toman")}`
    content = content.replace(
      /\$\{([^}]+)\}\s*([\u0600-\u06FF\u200c]+)/g,
      (match, expr, persian) => {
        const word = persian.trim();
        if (!isPersianDominant(word)) return match;
        needsT = true;
        if (word === "تومان") return `\${${expr}} \${t("common.toman")}`;
        return `\${${expr}} \${t(${JSON.stringify(resolveKey(word))})}`;
      },
    );

    // JSX: {expr} PersianWord
    content = content.replace(
      /(\{[^}\n]+\})\s+([\u0600-\u06FF][\u0600-\u06FF\u200c\s·/()]*[\u0600-\u06FF])/g,
      (match, expr, persian) => {
        const word = persian.trim();
        if (!word || word.includes("t(")) return match;
        needsT = true;
        if (word === "تومان") return `${expr} {t("common.toman")}`;
        if (word === "پروژه") return `${expr} {t("nav.projects")}`;
        if (word === "از") return `${expr} {t("common.of")}`;
        return `${expr} {t(${JSON.stringify(resolveKey(word))})}`;
      },
    );

    // Template literals with embedded Persian (no ${})
    content = content.replace(
      /`([^`\n$]*[\u0600-\u06FF][^`\n$]*)`/g,
      (match, inner) => {
        if (inner.includes("${")) return match;
        if (!isPersianDominant(inner.trim())) return match;
        needsT = true;
        return `t(${JSON.stringify(resolveKey(inner.trim()))})`;
      },
    );
  }

  if (!needsT || content === orig) return false;

  const beforeExport = content.search(
    /export (?:default )?(?:async )?(?:function|const|class)/,
  );
  const moduleUsesT =
    beforeExport !== -1 &&
    content.slice(0, beforeExport).includes("t(");

  if (isTsx) {
    content = addClientImport(content);
    content = addHook(content);
    if (moduleUsesT && !content.includes("getTranslator")) {
      content = addGetTranslator(content);
    }
  } else if (isTs) {
    content = addGetTranslator(content);
  }

  fs.writeFileSync(filePath, content, "utf8");
  return true;
}

let updated = 0;
for (const file of walk(SRC)) {
  if (transformFile(file)) {
    updated++;
    console.log("Updated:", path.relative(ROOT, file));
  }
}

fs.writeFileSync(
  path.join(ROOT, "src/i18n/persian-key-map.json"),
  JSON.stringify(map, null, 2),
);
fs.writeFileSync(
  path.join(ROOT, "scripts/i18n-translations.json"),
  JSON.stringify(translations, null, 2),
);
console.log(`\nDone. Updated ${updated} files.`);
