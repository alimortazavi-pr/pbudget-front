/**
 * Adds module-level getTranslator() when t() is used outside components.
 */
import fs from "fs";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node fix-module-t.mjs <files...>");
  process.exit(1);
}

const importLine = 'import { getTranslator } from "@/i18n";\n';
const hookLine = "const t = getTranslator();\n";

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes("t(") || content.includes("getTranslator")) continue;

  const firstExport = content.search(
    /export (?:default )?(?:async )?(?:function|const|class)/,
  );
  const beforeExport = firstExport === -1 ? content : content.slice(0, firstExport);
  if (!beforeExport.includes("t(")) continue;

  if (content.includes('from "@/i18n"')) {
    content = content.replace(
      /import\s*\{([^}]+)\}\s*from\s*"@\/i18n"/,
      (_m, imports) => {
        const parts = imports.split(",").map((s) => s.trim()).filter(Boolean);
        if (!parts.includes("getTranslator")) parts.push("getTranslator");
        return `import { ${parts.join(", ")} } from "@/i18n"`;
      },
    );
  } else {
    const useClient = content.startsWith('"use client"');
    if (useClient) {
      content = content.replace(
        '"use client";\n',
        `"use client";\n\n${importLine}${hookLine}`,
      );
    } else {
      const lastImport = content.lastIndexOf("\nimport ");
      if (lastImport === -1) {
        content = `${importLine}${hookLine}${content}`;
      } else {
        const importEnd = content.indexOf("\n", content.indexOf(";", lastImport));
        const pos = importEnd === -1 ? content.length : importEnd + 1;
        content =
          content.slice(0, pos) + `\n${hookLine}` + content.slice(pos);
        if (!content.includes('from "@/i18n"')) {
          content = content.slice(0, pos) + importLine + content.slice(pos);
        }
      }
    }
  }

  if (!content.includes("const t = getTranslator()")) {
    const useClient = content.startsWith('"use client"');
    if (useClient && !content.includes(hookLine)) {
      content = content.replace(
        /("use client";\n\nimport[^;]+;\n)/,
        `$1\n${hookLine}`,
      );
    }
  }

  fs.writeFileSync(file, content, "utf8");
  console.log("Fixed:", file);
}
