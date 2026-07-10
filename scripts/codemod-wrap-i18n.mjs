/**
 * Wraps hardcoded Persian UI strings in t() calls.
 * Run: node scripts/codemod-wrap-i18n.mjs
 */
import fs from "fs";
import path from "path";

const SRC = "src";
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "i18n"]);
const SKIP_FILES = new Set([
  "shell-nav.ts",
  "admin-nav.ts",
  "landing-data.ts",
  "iran-jalali-holidays.data.ts",
  "tours.ts",
]);

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!SKIP_DIRS.has(f)) walk(p, files);
    } else if (/\.tsx$/.test(f) && !SKIP_FILES.has(f)) {
      files.push(p);
    }
  }
  return files;
}

const persianRe = /[\u0600-\u06FF\u200c]/;

function hasUseTranslation(content) {
  return (
    content.includes("useTranslation") || content.includes("useLanguage")
  );
}

function addImport(content) {
  if (content.includes('from "@/components/providers/LanguageProvider"')) {
    if (!content.includes("useTranslation")) {
      return content.replace(
        /import\s*\{([^}]+)\}\s*from\s*"@\/components\/providers\/LanguageProvider"/,
        (m, imports) => {
          const parts = imports.split(",").map((s) => s.trim());
          if (!parts.includes("useTranslation")) {
            parts.push("useTranslation");
          }
          return `import { ${parts.join(", ")} } from "@/components/providers/LanguageProvider"`;
        },
      );
    }
    return content;
  }

  const importLine =
    'import { useTranslation } from "@/components/providers/LanguageProvider";\n';

  if (content.startsWith('"use client"')) {
    return content.replace(
      '"use client";\n',
      `"use client";\n\n${importLine}`,
    );
  }
  return importLine + content;
}

function addHookToComponent(content) {
  if (content.includes("const { t } = useTranslation()")) return content;

  // Function component
  const fnMatch = content.match(
    /export function (\w+)\([^)]*\)\s*\{/,
  );
  if (fnMatch) {
    const fnName = fnMatch[1];
    const idx = content.indexOf(fnMatch[0]) + fnMatch[0].length;
    return (
      content.slice(0, idx) +
      "\n  const { t } = useTranslation();" +
      content.slice(idx)
    );
  }

  return content;
}

function transformContent(content) {
  let changed = false;

  // JSX text nodes: >ذخیره<
  content = content.replace(
    />([^<>{}\n]*[\u0600-\u06FF][^<>{}\n]*)</g,
    (match, text) => {
      const trimmed = text.trim();
      if (!trimmed || !persianRe.test(trimmed)) return match;
      if (trimmed.includes("{") || trimmed.includes("t(")) return match;
      changed = true;
      return `>{t(${JSON.stringify(trimmed)})}<`;
    },
  );

  // String props: label="ذخیره" title="..." placeholder="..." aria-label="..."
  content = content.replace(
    /\b(label|title|placeholder|aria-label|description|alt|heading)=["']([^"']*[\u0600-\u06FF][^"']*)["']/g,
    (match, prop, text) => {
      if (text.includes("${")) return match;
      changed = true;
      return `${prop}={t(${JSON.stringify(text)})}`;
    },
  );

  // showToast("ذخیره شد") etc.
  content = content.replace(
    /\b(showToast|toast)\(\s*["']([^"']*[\u0600-\u06FF][^"']*)["']/g,
    (match, fn, text) => {
      changed = true;
      return `${fn}(t(${JSON.stringify(text)})`;
    },
  );

  if (!changed) return null;

  let result = content;
  if (!hasUseTranslation(result)) {
    result = addImport(result);
    result = addHookToComponent(result);
  }

  return result;
}

let updated = 0;
for (const file of walk(SRC)) {
  const content = fs.readFileSync(file, "utf8");
  if (!persianRe.test(content)) continue;

  const transformed = transformContent(content);
  if (transformed && transformed !== content) {
    fs.writeFileSync(file, transformed, "utf8");
    updated++;
    console.log("Updated:", file);
  }
}

console.log(`\nDone. Updated ${updated} files.`);
