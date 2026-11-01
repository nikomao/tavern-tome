import { createHash } from "node:crypto";
import { readFileSync, existsSync, appendFileSync } from "node:fs";

const HASH_FILE = new URL("../.github/patch-hash.txt", import.meta.url);
const res = await fetch("https://api.hearthstonejson.com/v1/latest/zhCN/cards.json", {
  headers: { "user-agent": "tavern-tome-patch-check" }
});
if (!res.ok) { console.error("fetch failed", res.status); process.exit(1); }
const buf = Buffer.from(await res.arrayBuffer());
const hash = createHash("sha256").update(buf).digest("hex").slice(0, 16);
const old = existsSync(HASH_FILE) ? readFileSync(HASH_FILE, "utf8").trim() : "";

console.log("stored:", old || "(none)");
console.log("latest:", hash);
console.log("changed:", old !== hash);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, "changed=" + (old !== hash) + "\n");
}
