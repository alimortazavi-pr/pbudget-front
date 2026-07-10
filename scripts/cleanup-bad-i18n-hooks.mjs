/**
 * Removes erroneous useTranslation hooks from custom hooks and nested handlers.
 */
import fs from "fs";
import path from "path";

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!["node_modules", ".next"].includes(f)) walk(p, files);
    } else if (/\.tsx$/.test(f)) files.push(p);
  }
  return files;
}

let fixed = 0;
for (const file of walk("src")) {
  let content = fs.readFileSync(file, "utf8");
  const orig = content;

  // Remove hook from export function useX() hooks
  content = content.replace(
    /(export function use\w+\(\) \{)\s*const \{ t \} = useTranslation\(\);\s*\n/g,
    "$1\n",
  );

  // Remove hook from async function handlers (parent component should have t)
  content = content.replace(
    /(async function \w+\([^)]*\) \{)\s*const \{ t \} = useTranslation\(\);\s*\n/g,
    "$1\n",
  );

  // Remove hook from plain function handlers at module level inside components
  content = content.replace(
    /(\n  function \w+\([^)]*\) \{)\s*const \{ t \} = useTranslation\(\);\s*\n/g,
    "$1\n",
  );

  if (content !== orig) {
    fs.writeFileSync(file, content, "utf8");
    fixed++;
    console.log("Cleaned:", file);
  }
}

// Add hook to BalanceModalDialog if missing
const balanceFile = "src/components/providers/BalanceModalProvider.tsx";
let balance = fs.readFileSync(balanceFile, "utf8");
if (!balance.includes("function BalanceModalDialog") || !balance.match(/function BalanceModalDialog[\s\S]*?const \{ t \}/)) {
  balance = balance.replace(
    /function BalanceModalDialog\(\{[\s\S]*?\}\) \{\n/,
    (m) => m + "  const { t } = useTranslation();\n",
  );
  fs.writeFileSync(balanceFile, balance, "utf8");
  console.log("Added hook to BalanceModalDialog");
}

console.log(`Cleaned ${fixed} files.`);
