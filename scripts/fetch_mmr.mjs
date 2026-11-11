#!/usr/bin/env node
/** 生成 stats-mmr.js：各 MMR 分段的英雄榜（100/50/10/1）。 */
import { gunzipSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const H = { "user-agent": "tavern-tome/1.0" };
const SEGS = [100, 50, 10, 1];

async function getJson(url) {
  console.log("Fetching:", url);
  const r = await fetch(url, { headers: H, signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(url + " " + r.status);
  const b = Buffer.from(await r.arrayBuffer());
  return JSON.parse(b[0] === 0x1f ? gunzipSync(b).toString("utf8") : b.toString("utf8"));
}

function rates(h) {
  const dist = h.placementDistribution || [];
  const total = dist.reduce((a, x) => a + (x.totalMatches || 0), 0);
  const top4 = dist.filter(x => x.rank <= 4).reduce((a, x) => a + (x.totalMatches || 0), 0);
  const first = (dist.find(x => x.rank === 1) || {}).totalMatches || 0;
  return { top4: total ? top4 / total : 0, win: total ? first / total : 0 };
}

const cards = await getJson("https://api.hearthstonejson.com/v1/latest/zhCN/cards.json");
const names = {};
for (const c of cards) if (c.id) names[c.id] = c.name;

const out = {};
for (const seg of SEGS) {
  const hs = await getJson("https://static.zerotoheroes.com/api/bgs/hero-stats/mmr-" + seg + "/last-patch/overview-from-hourly.gz.json");
  const minPicks = seg === 1 ? 15 : seg === 10 ? 50 : 100;
  const heroes = hs.heroStats
    .filter(h => names[h.heroCardId] && h.totalPicked >= minPicks)
    .map(h => {
      const r = rates(h);
      return {
        name: names[h.heroCardId], tier: "T2",
        winrate: +r.win.toFixed(4), top4: +r.top4.toFixed(4),
        avg: +h.averagePosition.toFixed(2),
        pickrate: h.totalOffered ? +(h.totalPicked / h.totalOffered * 100).toFixed(2) : 0
      };
    })
    .sort((a, b) => a.avg - b.avg);
  heroes.forEach((h, i) => { const p = i / heroes.length; h.tier = p < 0.1 ? "T0" : p < 0.3 ? "T1" : p < 0.6 ? "T2" : "T3"; });
  out[seg] = { sample: hs.dataPoints, fetchedAt: (hs.lastUpdateDate || "").slice(0, 10), heroes };
}

const js = "/* 各 MMR 分段英雄榜（由 scripts/fetch_mmr.mjs 生成） */\nconst STATS_MMR = " + JSON.stringify(out, null, 1) + ";\n";
writeFileSync(resolve(root, "stats-mmr.js"), js);
console.log("分段完成：" + SEGS.map(s => s + "=" + out[s].heroes.length).join(" ") + "，文件 " + Math.round(js.length / 1024) + " KB");
