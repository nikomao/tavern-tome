#!/usr/bin/env node
/**
 * 把外部导出的对局统计 JSON 写入 stats.js。
 *
 * 用法:
 *   node scripts/import_stats.mjs stats-input.json
 *
 * 输入格式（示例）:
 * {
 *   "source": "HSReplay",
 *   "url": "https://hsreplay.net/battlegrounds/heroes/",
 *   "fetchedAt": "2026-11-02",
 *   "bracket": "10000+",
 *   "region": "ALL",
 *   "sample": 12000,
 *   "heroes": [{ "name": "血魔", "tier": "T0", "winrate": 0.62, "pickrate": 0.18 }],
 *   "comps":  [{ "name": "畸变怪·喝茶", "tier": "T0", "top4": 0.71, "win": 0.19 }]
 * }
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const input = process.argv[2];
if (!input) {
  console.error("用法: node scripts/import_stats.mjs <stats.json>");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(resolve(input), "utf8"));
const TIERS = ["T0", "T1", "T2", "T3"];

const heroes = (raw.heroes || []).map(h => ({
  name: String(h.name || "").trim(),
  tier: TIERS.includes(h.tier) ? h.tier : "T2",
  winrate: Number(h.winrate) || 0,
  top4: Number(h.top4) || 0,
  avg: Number(h.avg) || 0,
  pickrate: Number(h.pickrate) || 0
})).filter(h => h.name);

const comps = (raw.comps || []).map(c => ({
  name: String(c.name || "").trim(),
  tier: TIERS.includes(c.tier) ? c.tier : "T2",
  top4: Number(c.top4) || 0,
  win: Number(c.win) || 0,
  avg: Number(c.avg) || 0,
  sample: Number(c.sample) || 0,
  cards: Array.isArray(c.cards) ? c.cards.slice(0, 7).map(x => ({ id: x.id, name: x.name, status: x.status, role: x.role || 'mid' })) : [],
  heroes: Array.isArray(c.heroes) ? c.heroes.slice(0, 3) : [],
  difficulty: c.difficulty || "",
  power: c.power || ""
})).filter(c => c.name);

if (!heroes.length && !comps.length) {
  console.error("输入里没有 heroes / comps，未写入。");
  process.exit(1);
}

const out = {
  source: raw.source || "外部数据",
  url: raw.url || "",
  fetchedAt: raw.fetchedAt || new Date().toISOString().slice(0, 10),
  bracket: raw.bracket || "",
  region: raw.region || "",
  sample: Number(raw.sample) || 0,
  heroes,
  comps,
  trinkets: (raw.trinkets || []).map(t => ({
    name: String(t.name || "").trim(),
    avg: Number(t.avg) || 0,
    pickrate: Number(t.pickrate) || 0,
    sample: Number(t.sample) || 0
  })).filter(t => t.name)
};

const js = "/* 对局统计数据（由 scripts/import_stats.mjs 生成） */\nconst STATS = " +
  JSON.stringify(out, null, 2) + ";\n";
writeFileSync(resolve(root, "stats.js"), js);
console.log("写入 stats.js：英雄 " + heroes.length + " 条，阵容 " + comps.length + " 条");
