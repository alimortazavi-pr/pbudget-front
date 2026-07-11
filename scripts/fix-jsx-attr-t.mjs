/**
 * Fixes codemod bug: subtitle=t("key") → subtitle={t("key")}
 */
import fs from "fs";
import path from "path";

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!["node_modules", ".next"].includes(f)) walk(p, files);
    } else if (p.endsWith(".tsx")) files.push(p);
  }
  return files;
}

let fixed = 0;
for (const file of walk("src")) {
  let content = fs.readFileSync(file, "utf8");
  const next = content.replace(/(\w[\w.-]*)=t\(/g, "$1={t(");
  if (next !== content) {
    fs.writeFileSync(file, next, "utf8");
    fixed++;
    console.log("Fixed:", file);
  }
}
console.log(`Fixed ${fixed} files.`);
