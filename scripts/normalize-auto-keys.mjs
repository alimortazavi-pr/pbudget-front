/**
 * Ensures every Persian string in persian-key-map has a unique auto key.
 */
import crypto from "crypto";
import fs from "fs";

const map = JSON.parse(
  fs.readFileSync("src/i18n/persian-key-map.json", "utf8"),
);

function hashKey(fa) {
  return `auto.k${crypto.createHash("md5").update(fa).digest("hex").slice(0, 10)}`;
}

const used = new Set();
let fixed = 0;

for (const [fa, key] of Object.entries(map)) {
  if (!key.startsWith("auto.")) continue;
  const unique = hashKey(fa);
  if (key !== unique) {
    map[fa] = unique;
    fixed++;
  }
  used.add(unique);
}

fs.writeFileSync("src/i18n/persian-key-map.json", JSON.stringify(map, null, 2));
console.log(`Normalized ${fixed} keys. Total auto entries: ${used.size}`);
