#!/usr/bin/env node
/**
 * 拉取 Firestone / ZeroToHeroes 的酒馆战棋统计，生成 stats-input.json。
 * 用法: node scripts/fetch_firestone.mjs [mmrPercentile]
 */
import { gunzipSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MMR = process.argv[2] || "100";
const H = { "user-agent": "tavern-tome/1.0" };

const CN = {
  dragon_shield: "龙·圣盾", aberration_discard: "畸变怪·弃牌", neutral_tea_set: "中立·喝茶",
  mech_apm: "机械·APM", mech_volumizer: "机械·扩音机", murloc_end_of_turn: "鱼人·回合结束",
  demon_boost_shop: "恶魔·养酒馆", quilboar_choose_one: "野猪人·抉择", elemental_azerite: "元素·艾泽里特",
  elemental_cycle: "元素·倒转", quilboar_felboar_spam: "野猪人·邪能猪", aberration_deathrattle: "畸变怪·亡语",
  undead_apm: "亡灵·APM", undead_eternal_knight: "亡灵·永恒骑士", murloc_scam: "鱼人·下毒",
  murloc_handbuff: "鱼人·手牌 buff", undead_butcher: "亡灵·屠夫", demon_self_damage: "恶魔·自伤",
  beast_lobster: "野兽·龙虾", dragon_spell_power: "龙·法强", pirate_discover: "海盗·发现",
  elemental_tempest: "元素·风暴", beast_beetle: "野兽·甲虫", quilboar_gem_spam: "野猪人·宝石",
  beast_leviathan: "野兽·巨兽", dragon_kalecgos: "龙·卡雷苟斯", pirate_bounty: "海盗·悬赏",
  mech_glambot: "机械·魅力机器人"
};

async function getJson(url) {
  const r = await fetch(url, { headers: H });
  if (!r.ok) throw new Error(url + " " + r.status);
  const buf = Buffer.from(await r.arrayBuffer());
  const text = buf[0] === 0x1f ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
  return JSON.parse(text);
}

function rates(h) {
  const dist = h.placementDistribution || [];
  const total = dist.reduce((a, x) => a + (x.totalMatches || 0), 0);
  const top4 = dist.filter(x => x.rank <= 4).reduce((a, x) => a + (x.totalMatches || 0), 0);
  const first = (dist.find(x => x.rank === 1) || {}).totalMatches || 0;
  return { total, top4: total ? top4 / total : 0, win: total ? first / total : 0 };
}

const hs = await getJson("https://static.zerotoheroes.com/api/bgs/hero-stats/mmr-" + MMR + "/last-patch/overview-from-hourly.gz.json");
const cs = await getJson("https://static.zerotoheroes.com/api/bgs/comp-stats/last-patch/overview-v3.gz.json");
const strat = await getJson("https://static.zerotoheroes.com/hearthstone/data/battlegrounds-strategies/bgs-comps-strategies.gz.json");
const tr = await getJson("https://static.zerotoheroes.com/api/bgs/trinket-stats/last-patch/overview-from-hourly.gz.json");
const cards = await getJson("https://api.hearthstonejson.com/v1/latest/zhCN/cards.json");

const names = {};
for (const c of cards) if (c.id) names[c.id] = c.name;
const stratById = {};
for (const s of strat) if (s.compId) stratById[s.compId] = s;

const heroes = hs.heroStats
  .filter(h => names[h.heroCardId] && h.totalPicked >= 300)
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

const comps = cs.compStats
  .filter(c => c.dataPoints >= 800 && CN[c.archetype])
  .map(c => {
    const r = rates(c);
    const s = stratById[c.archetype];
    let lineup = [];
    if (s && Array.isArray(s.cards)) {
      const order = { CORE: 0, ADDON: 1, CYCLE: 2 };
      lineup = [...s.cards]
        .sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3) || (b.finalBoardWeight || 0) - (a.finalBoardWeight || 0))
        .slice(0, 7)
        .map(x => ({ id: x.cardId, name: names[x.cardId] || x.name, status: x.status }));
    }
    const compHeroes = (c.heroStats || [])
      .filter(h => h.dataPoints >= 50 && names[h.heroCardId])
      .sort((a, b) => a.averagePlacement - b.averagePlacement)
      .slice(0, 3)
      .map(h => names[h.heroCardId]);
    return {
      name: CN[c.archetype], tier: "T2",
      top4: +r.top4.toFixed(4), win: +r.win.toFixed(4),
      avg: +c.averagePlacement.toFixed(2), sample: c.dataPoints,
      cards: lineup,
      heroes: compHeroes,
      difficulty: s ? s.difficulty : "",
      power: s ? s.powerLevel : ""
    };
  })
  .sort((a, b) => a.avg - b.avg);
comps.forEach((c, i) => { const p = i / comps.length; c.tier = p < 0.15 ? "T0" : p < 0.4 ? "T1" : p < 0.7 ? "T2" : "T3"; });

const trinkets = (tr.trinketStats || [])
  .filter(t => t.dataPoints >= 1000 && names[t.trinketCardId])
  .map(t => ({
    name: names[t.trinketCardId],
    avg: +t.averagePlacement.toFixed(2),
    pickrate: +(t.pickRate * 100).toFixed(1),
    sample: t.dataPoints
  }))
  .sort((a, b) => a.avg - b.avg)
  .slice(0, 8);

const out = {
  source: "Firestone / ZeroToHeroes",
  url: "https://static.zerotoheroes.com/api/bgs/",
  fetchedAt: (hs.lastUpdateDate || "").slice(0, 10),
  bracket: MMR === "100" ? "全部 MMR" : "MMR 前 " + MMR + "%",
  region: "ALL",
  sample: hs.dataPoints,
  heroes, comps, trinkets
};
writeFileSync(resolve(root, "stats-input.json"), JSON.stringify(out, null, 1));
console.log("英雄 " + heroes.length + "，阵容 " + comps.length + "，饰品 " + trinkets.length + "，样本 " + out.sample);
