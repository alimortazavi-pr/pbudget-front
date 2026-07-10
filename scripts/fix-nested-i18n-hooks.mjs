/**
 * Adds useTranslation hook to nested function components that use t().
 * Run: node scripts/fix-nested-i18n-hooks.mjs
 */
import fs from "fs";
import path from "path";

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!["node_modules", ".next", "i18n"].includes(f)) walk(p, files);
    } else if (/\.tsx$/.test(f)) files.push(p);
  }
  return files;
}

const HOOK_LINE = "  const { t } = useTranslation();\n";

function fixFile(file) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes("t(")) return false;

  if (!content.includes("useTranslation")) {
    if (content.startsWith('"use client"')) {
      content = content.replace(
        '"use client";\n',
        '"use client";\n\nimport { useTranslation } from "@/components/providers/LanguageProvider";\n',
      );
    } else {
      content =
        'import { useTranslation } from "@/components/providers/LanguageProvider";\n' +
        content;
    }
  }

  const funcRe =
    /((?:export\s+)?function\s+\w+\s*\([^)]*\)\s*\{)/g;
  let changed = false;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = funcRe.exec(content))) {
    const fnStart = match.index;
    const bodyStart = fnStart + match[0].length;
    const nextFn = funcRe.lastIndex;
    // find function body until next function at same level - approximate by next `function `
    const searchFrom = bodyStart;
    let bodyEnd = content.length;
    const rest = content.slice(searchFrom);
    const nextMatch = rest.match(/\n(?:export\s+)?function\s+\w+\s*\(/);
    if (nextMatch) bodyEnd = searchFrom + nextMatch.index;

    const body = content.slice(bodyStart, bodyEnd);
    if (body.includes("t(") && !body.includes("useTranslation")) {
      parts.push(content.slice(lastIndex, bodyStart));
      parts.push(HOOK_LINE);
      lastIndex = bodyStart;
      changed = true;
    }
  }

  if (!changed) return false;
  parts.push(content.slice(lastIndex));
  fs.writeFileSync(file, parts.join(""), "utf8");
  return true;
}

let fixed = 0;
for (const file of walk("src")) {
  if (fixFile(file)) {
    fixed++;
    console.log("Fixed:", file);
  }
}
console.log(`\nFixed ${fixed} files.`);
