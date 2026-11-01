#!/usr/bin/env node
/**
 * 对比上一版 stats-input.json，生成 stats-change.js（排名/梯度/均位变化）。
 * 优先读 stats-prev.json；没有就用 git HEAD~1；都没有则视为首次接入。
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cur = JSON.parse(readFileSync(resolve(root, "stats-input.json"), "utf8"));

function loadPrev() {
  const prevPath = resolve(root, "stats-prev.json");
  if (existsSync(prevPath)) return JSON.parse(readFileSync(prevPath, "utf8"));
  try {
    return JSON.parse(execSync("git show HEAD~1:stats-input.json", { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  } catch (e) { return null; }
}

const prev = loadPrev();
const out = { from: prev ? prev.fetchedAt : "", to: cur.fetchedAt, first: !prev, sampleFrom: prev ? prev.sample : 0, sampleTo: cur.sample, heroes: [], comps: [] };

function rankMap(list, keyFn) {
  const sorted = [...list].sort((a, b) => a.avg - b.avg);
  const m = {};
  sorted.forEach((x, i) => { m[keyFn(x)] = i + 1; });
  return m;
}

if (prev) {
  const prevHeroRank = rankMap(prev.heroes || [], h => h.name);
  const curHeroRank = rankMap(cur.heroes || [], h => h.name);
  const hm = {}; (prev.heroes || []).forEach(h => { hm[h.name] = h; });
  for (const h of cur.heroes || []) {
    const p = hm[h.name];
    if (!p) continue;
    const rankFrom = prevHeroRank[h.name], rankTo = curHeroRank[h.name];
    const delta = +(h.avg - p.avg).toFixed(2);
    if (rankFrom === rankTo && delta === 0 && h.tier === p.tier) continue;
    out.heroes.push({ name: h.name, rankFrom, rankTo, avgFrom: p.avg, avgTo: h.avg, delta, tierFrom: p.tier, tierTo: h.tier });
  }
  out.heroes.sort((a, b) => (Math.abs(b.rankFrom - b.rankTo) - Math.abs(a.rankFrom - a.rankTo)) || (Math.abs(b.delta) - Math.abs(a.delta)));
  out.heroes = out.heroes.slice(0, 6);

  const prevCompRank = rankMap(prev.comps || [], c => c.key || c.name);
  const curCompRank = rankMap(cur.comps || [], c => c.key || c.name);
  const cm = {}; (prev.comps || []).forEach(c => { cm[c.key || c.name] = c; });
  for (const c of cur.comps || []) {
    const k = c.key || c.name, p = cm[k];
    if (!p) continue;
    const rankFrom = prevCompRank[k], rankTo = curCompRank[k];
    const delta = +(c.avg - p.avg).toFixed(2);
    if (rankFrom === rankTo && delta === 0 && c.tier === p.tier) continue;
    out.comps.push({ key: c.key, name: c.name, rankFrom, rankTo, avgFrom: p.avg, avgTo: c.avg, delta, tierFrom: p.tier, tierTo: c.tier });
  }
  out.comps.sort((a, b) => (Math.abs(b.rankFrom - b.rankTo) - Math.abs(a.rankFrom - a.rankTo)) || (Math.abs(b.delta) - Math.abs(a.delta)));
  out.comps = out.comps.slice(0, 6);
}

writeFileSync(resolve(root, "stats-change.js"),
  "/* 本周变化（由 scripts/diff_stats.mjs 生成） */\nconst STATS_CHANGE = " + JSON.stringify(out, null, 2) + ";\n");
copyFileSync(resolve(root, "stats-input.json"), resolve(root, "stats-prev.json"));
console.log("变化：英雄 " + out.heroes.length + "，阵容 " + out.comps.length + (out.first ? "（首次接入）" : ""));
