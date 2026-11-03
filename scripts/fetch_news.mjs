#!/usr/bin/env node
/**
 * 社区热点与官方新闻自动抓取与多语言翻译脚本
 * 
 * 来源：Reddit r/BobsTavern / 暴雪官方更新 / Hearthpwn / 炉石战棋资讯
 * 特性：
 * 1. 垃圾信息过滤（过滤非战棋无关话题、微博体育热搜标签等）
 * 2. 酒馆战棋专属词库预处理与后置校正（Quilboar->野猪人, Hotfix->热修补丁, TIL->机制冷知识等）
 * 3. 智能多语言翻译（生成 titleZh 简体中文与 titleZhtw 繁体中文）
 * 4. 自动类别标签归类（官方补丁 / 机制冷知识 / 天梯动态 / 社区热议）
 * 5. 故障保护与缓存合并（网络抖动时不覆写清空既有新闻）
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const H = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 TavernTome/2.0"
};

// 常见酒馆战棋专业术语预替换/规范词库
const PRE_REPLACEMENTS = [
  [/\bquills\b/gi, "Quilboar"],
  [/\bsneak peak\b|\bsneak peek\b/gi, "preview leak"],
  [/\bwent 8th\b|\bgot 8th\b/gi, "got 8th place"],
  [/\bentire lobby\b/gi, "all players in the lobby"],
  [/\benhance-o mechano\b/gi, "Enhance-o-Mechano"],
  [/\bbalance patch\b/gi, "balance update patch"],
  [/\bhotfix patch\b|\bhotfix\b/gi, "hotfix update"]
];

const GLOSSARY_EN_TO_ZH = [
  [/\bquillboar\b|\bquills\b/gi, "野猪人"],
  [/\bquilboars?\b/gi, "野猪人"],
  [/\bpirates?\b/gi, "海盗"],
  [/\bdemons?\b/gi, "恶魔"],
  [/\bnagas?\b/gi, "纳迦"],
  [/\bbeasts?\b/gi, "野兽"],
  [/\bmechs?\b/gi, "机械"],
  [/\bmurlocs?\b/gi, "鱼人"],
  [/\belementals?\b/gi, "元素"],
  [/\bundead\b/gi, "亡灵"],
  [/\bdragons?\b/gi, "龙族"],
  [/\baberrations?\b/gi, "畸变随从"],
  [/\banomalies\b|\banomaly\b/gi, "畸变模式"],
  [/\bdivine shield\b/gi, "圣盾"],
  [/\bwindfury\b/gi, "风怒"],
  [/\bvenomous\b|\bpoisonous\b/gi, "烈毒"],
  [/\breborn\b/gi, "复生"],
  [/\btaunt\b/gi, "嘲讽"],
  [/\bdeathrattle\b/gi, "亡语"],
  [/\bbattlecry\b/gi, "战吼"],
  [/\btrinkets?\b/gi, "饰品"],
  [/\bspells?\b/gi, "法术"],
  [/\btavern\b/gi, "酒馆"],
  [/\bbob's tavern\b|\bbobstavern\b/gi, "酒馆战棋"],
  [/\bhotfix patch\b|\bhotfix\b/gi, "热修补丁"],
  [/\bpatch notes\b/gi, "版本更新公告"],
  [/\bbalance patch\b/gi, "平衡补丁"],
  [/\bsneak peek\b|\bsneak peak\b/gi, "前瞻偷跑预告"],
  [/\bwent 8th\b|\bgot 8th\b/gi, "速8出局"],
  [/\bwent 1st\b|\bgot 1st\b/gi, "吃鸡第一"],
  [/\bhigh mmr\b/gi, "万分高端局"],
  [/\bmmr\b/gi, "天梯分"],
  [/\bnerfed\b/gi, "被削弱"],
  [/\bnerf\b/gi, "削弱"],
  [/\bbuffed\b/gi, "被加强"],
  [/\bbuff\b/gi, "增强"],
  [/\btil:\s*/gi, "【机制冷知识】"],
  [/\btil\b/gi, "机制冷知识"],
  [/\benhance-o mechano\b/gi, "强化机器人"],
  [/\bfishbait\b/gi, "鱼饵"],
  [/\bblizzard entertainment\b|\bblizzard news\b/gi, "暴雪官方"],
  [/\bblizzard\b/gi, "暴雪"],
  [/\bhearthstone\b/gi, "炉石传说"],
  [/\bbattlegrounds\b/gi, "酒馆战棋"],
  [/\blobby\b/gi, "本局全场"],
  [/\btier list\b/gi, "梯度排行榜"]
];

const POST_REPLACEMENTS = [
  [/余额/g, "平衡"],
  [/预览泄漏|泄漏/g, "前瞻偷跑"],
  [/羽毛球/g, "野猪人"],
  [/Quillboar/gi, "野猪人"],
  [/修补程序/g, "热修补丁"],
  [/潜行巅峰/g, "平衡前瞻预告"],
  [/大堂|大厅/g, "本局全员"],
  [/神盾/g, "圣盾"],
  [/强化-o机械|强化-o-机械|强化机甲/g, "强化机器人"],
  [/暴雪娱乐/g, "暴雪官方"],
  [/娜迦/g, "纳迦"],
  [/补丁说明/g, "版本更新公告"],
  [/补丁说明书/g, "版本更新公告"],
  [/排在第\s*8\s*位|排在第八位/g, "速8出局"],
  [/机制发现/g, "机制冷知识"],
  [/机制查找/g, "机制冷知识"]
];

// 简体转繁体本地化映射规则
const ZH_TO_ZHTW = [
  ["酒馆战棋", "英雄戰場"],
  ["酒馆", "旅店"],
  ["随从", "手下"],
  ["亡语", "死亡之聲"],
  ["战吼", "戰吼"],
  ["圣盾", "聖盾術"],
  ["复生", "複生"],
  ["烈毒", "烈毒"],
  ["剧毒", "劇毒"],
  ["风怒", "風怒"],
  ["嘲讽", "嘲諷"],
  ["野猪人", "野豬人"],
  ["恶魔", "惡魔"],
  ["野兽", "野獸"],
  ["机械", "機械"],
  ["鱼人", "魚人"],
  ["海盗", "海盜"],
  ["纳迦", "納迦"],
  ["亡灵", "不死族"],
  ["畸变随从", "畸變體手下"],
  ["畸变模式", "畸變模式"],
  ["畸变", "畸變體"],
  ["暴雪官方", "暴雪官方"],
  ["炉石传说", "爐石戰記"],
  ["补丁", "更新檔"],
  ["更新公告", "更新說明"],
  ["热修", "即時修正"],
  ["削弱", "削弱"],
  ["增强", "增強"],
  ["强化机器人", "強化機器人"],
  ["鱼饵", "魚餌"],
  ["前瞻偷跑预告", "搶先預覽"],
  ["机制冷知识", "機制冷知識"],
  ["梯度排行榜", "強度排行榜"],
  ["速8出局", "速8出局"],
  ["万分高端局", "萬分高端場"],
  ["社区热议", "社群熱議"],
  ["官方补丁", "官方更新"],
  ["机制探讨", "機制探討"],
  ["天梯平衡", "天梯平衡"]
];

// 字符级简繁映射补充
const CHAR_MAP = {
  "补": "補", "丁": "丁", "数": "數", "据": "據", "点": "點", "线": "線", "转": "轉", "换": "換",
  "门": "門", "图": "圖", "开": "開", "关": "關", "体": "體", "系": "系", "这": "這", "么": "麼",
  "后": "後", "对": "對", "局": "局", "战": "戰", "胜": "勝", "负": "負", "获": "獲", "得": "得",
  "终": "終", "结": "結", "发": "發", "动": "動", "机": "機", "宝": "寶", "石": "石", "术": "術",
  "法": "法", "头": "頭", "选": "選", "择": "擇", "进": "進", "阶": "階", "质": "質", "总": "總",
  "览": "覽", "评": "評", "价": "價", "热": "熱", "议": "議", "独": "獨", "家": "家", "秘": "秘",
  "籍": "籍", "测": "測", "试": "試", "预": "預", "览": "覽", "谁": "誰", "排": "排", "位": "位",
  "说": "說", "明": "明", "显": "顯", "示": "示", "实": "實", "际": "際", "发": "發", "现": "現"
};

function toZhTw(str) {
  let s = String(str || "");
  for (const [zh, tw] of ZH_TO_ZHTW) {
    s = s.replaceAll(zh, tw);
  }
  return s.split("").map(ch => CHAR_MAP[ch] || ch).join("");
}

function decode(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—").replace(/&ndash;/g, "–");
}

function strip(s) {
  return decode(String(s || "").replace(/<[^>]+>/g, "")).trim();
}

/** 过滤垃圾新闻（如微博体育营销号把孙颖莎带上酒馆战棋tag） */
function isGarbage(title, source) {
  if (!title || title.length < 4) return true;
  // 过滤多重hashtag微博格式营销号
  if (/#.+?#.*#.+?#/.test(title)) return true;
  if (/孙颖莎|王曼昱|乒乓|文婕斋/.test(title)) return true;
  // 过滤无关联娱乐八卦
  if (!/battleground|tavern|bobs|hearthstone|patch|nerf|buff|quill|demon|pirate|naga|murloc|mech|beast|undead|dragon|elemental|酒馆|战棋|炉石|补丁|随从|饰品|英雄/i.test(title)) {
    return true;
  }
  return false;
}

/** 智能推断新闻类型 */
function detectKind(title) {
  const t = title.toLowerCase();
  if (/patch|hotfix|update|37\.|36\.|35\.|补丁|更新|公告|修正/i.test(t)) {
    return "patch";
  }
  if (/til:|til|interaction|combo|how does|mechanic|synergy|bug|机制|冷知识|配合|互动|结算/i.test(t)) {
    return "mechanic";
  }
  if (/nerf|buff|meta|tier|overpower|broken|winrate|削弱|加强|强势|胜率|梯队|上分/i.test(t)) {
    return "meta";
  }
  return "discussion";
}

function getTagZh(kind) {
  switch (kind) {
    case "patch": return "官方补丁";
    case "mechanic": return "机制冷知识";
    case "meta": return "天梯平衡";
    default: return "社区热议";
  }
}

/** 带超时的 Fetch 工具 */
async function fetchWithTimeout(url, opts = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function get(url, timeoutMs = 8000) {
  const r = await fetchWithTimeout(url, { headers: H }, timeoutMs);
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return r.text();
}

/** 英文翻译至中文 (带专业词库增强) */
async function translateEnToZh(text) {
  if (!text || !/[a-zA-Z]{3,}/.test(text)) {
    // 已经主要是中文，直接返回
    return text;
  }

  // 预处理专业词汇，规避通用翻译器将特定游戏术语翻译成无关词语
  let preProcessed = text;
  for (const [re, rep] of PRE_REPLACEMENTS) {
    preProcessed = preProcessed.replace(re, rep);
  }

  let translated = "";

  // 1. 尝试 MyMemory 免费公共翻译接口
  try {
    const query = encodeURIComponent(preProcessed);
    const r = await fetchWithTimeout(
      `https://api.mymemory.translated.net/get?q=${query}&langpair=en|zh-CN`,
      { headers: H },
      6000
    );
    if (r.ok) {
      const data = await r.json();
      let trans = data?.responseData?.translatedText;
      if (trans && trans !== preProcessed && !trans.includes("MYMEMORY WARNING")) {
        translated = trans.trim();
      }
    }
  } catch (e) {
    // 继续尝试下一个备选
  }

  // 2. 尝试 Google Translate 免费接口（在云端/GitHub Actions 中极度稳定）
  if (!translated) {
    try {
      const gUrl = new URL("https://translate.googleapis.com/translate_a/single");
      gUrl.searchParams.set("client", "gtx");
      gUrl.searchParams.set("sl", "auto");
      gUrl.searchParams.set("tl", "zh-CN");
      gUrl.searchParams.set("dt", "t");
      gUrl.searchParams.set("q", preProcessed);
      const gr = await fetchWithTimeout(gUrl.toString(), { headers: H }, 5000);
      if (gr.ok) {
        const gd = await gr.json();
        let trans = gd?.[0]?.map(x => x[0]).join("");
        if (trans && trans.trim()) {
          translated = trans.trim();
        }
      }
    } catch (e) {
      // 继续后备词典替换
    }
  }

  // 3. 终极后备：通过词典正则表达式直译
  if (!translated) {
    translated = preProcessed;
    for (const [re, rep] of GLOSSARY_EN_TO_ZH) {
      translated = translated.replace(re, rep);
    }
  }

  // 后置专业词汇清洗
  for (const [re, rep] of GLOSSARY_EN_TO_ZH) {
    translated = translated.replace(re, rep);
  }
  for (const [re, rep] of POST_REPLACEMENTS) {
    translated = translated.replace(re, rep);
  }

  return translated.trim();
}

function parseReddit(xml) {
  const out = [];
  const re = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = re.exec(xml))) {
    const b = m[1];
    const rawTitle = strip((b.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1]);
    const link = (b.match(/<link[^>]*href="([^"]+)"/) || [])[1];
    const updated = (b.match(/<updated>([^<]+)<\/updated>/) || [])[1];
    if (rawTitle && link && !isGarbage(rawTitle, "Reddit")) {
      const kind = detectKind(rawTitle);
      out.push({
        source: "Reddit",
        title: rawTitle,
        url: link,
        ts: updated ? Date.parse(updated) : Date.now(),
        kind
      });
    }
  }
  return out;
}

function parseRss(xml, defaultSource = "News") {
  const out = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml))) {
    const b = m[1];
    const rawTitle = strip((b.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1]);
    const link = strip((b.match(/<link>([\s\S]*?)<\/link>/) || [])[1]);
    const date = (b.match(/<pubDate>([^<]+)<\/pubDate>/) || [])[1];
    const src = strip((b.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1]) || defaultSource;
    if (rawTitle && link && !isGarbage(rawTitle, src)) {
      const kind = detectKind(rawTitle);
      out.push({
        source: src,
        title: rawTitle,
        url: link,
        ts: date ? Date.parse(date) : Date.now(),
        kind
      });
    }
  }
  return out;
}

async function main() {
  const newsPath = resolve(root, "news.json");
  let existingData = { updated: new Date().toISOString(), items: [] };
  if (existsSync(newsPath)) {
    try {
      existingData = JSON.parse(readFileSync(newsPath, "utf8"));
    } catch (e) {
      console.warn("无法解析已有 news.json:", e.message);
    }
  }

  const fetchedItems = [];

  // 1. Reddit r/BobsTavern
  try {
    const redditXml = await get("https://www.reddit.com/r/BobsTavern/.rss", 6000);
    const parsed = parseReddit(redditXml).slice(0, 10);
    fetchedItems.push(...parsed);
    console.log(`[Reddit] 抓取到 ${parsed.length} 条热帖`);
  } catch (e) {
    console.warn("[Reddit] 抓取跳过:", e.message);
  }

  // 2. Google News 中文酒馆战棋
  try {
    const gZhXml = await get(
      "https://news.google.com/rss/search?q=%E7%82%89%E7%9F%B3%E4%BC%A0%E8%AF%B4+%E9%85%92%E9%A6%86%E6%88%98%E6%A3%8B&hl=zh-CN&gl=CN&ceid=CN:zh-Hans",
      6000
    );
    const parsed = parseRss(gZhXml, "炉石资讯").slice(0, 6);
    fetchedItems.push(...parsed);
    console.log(`[Google News ZH] 抓取到 ${parsed.length} 条资讯`);
  } catch (e) {
    console.warn("[Google News ZH] 抓取跳过:", e.message);
  }

  // 3. Google News 英文 Hearthstone Battlegrounds
  try {
    const gEnXml = await get(
      "https://news.google.com/rss/search?q=Battlegrounds+Hearthstone+patch&hl=en-US&gl=US&ceid=US:en",
      6000
    );
    const parsed = parseRss(gEnXml, "Blizzard").slice(0, 6);
    fetchedItems.push(...parsed);
    console.log(`[Google News EN] 抓取到 ${parsed.length} 条资讯`);
  } catch (e) {
    console.warn("[Google News EN] 抓取跳过:", e.message);
  }

  // 4. Hearthpwn News (战棋补丁)
  try {
    const hpXml = await get("https://www.hearthpwn.com/news.rss", 6000);
    const parsed = parseRss(hpXml, "Hearthpwn")
      .filter(x => /battleground|tavern|patch|hotfix|darkmoon/i.test(x.title))
      .slice(0, 5);
    fetchedItems.push(...parsed);
    console.log(`[Hearthpwn] 抓取到 ${parsed.length} 条资讯`);
  } catch (e) {
    console.warn("[Hearthpwn] 抓取跳过:", e.message);
  }

  // 合并既有条目与新抓取条目（防止网络波动丢失数据）
  const pool = [...fetchedItems, ...(existingData.items || [])];
  
  // 过滤垃圾与去重
  const seen = new Set();
  const validItems = [];
  for (const item of pool) {
    if (!item.title || isGarbage(item.title, item.source)) continue;
    // 标准化标题用于排重
    const norm = item.title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "");
    if (seen.has(norm)) continue;
    seen.add(norm);
    validItems.push(item);
  }

  // 按时间倒序排序，截取前 18 条最热内容
  validItems.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const finalItems = validItems.slice(0, 18);

  console.log(`准备翻译并生成多语言字段，共 ${finalItems.length} 条热点...`);

  // 多语言翻译与字段补全
  for (const it of finalItems) {
    it.kind = detectKind(it.title + " " + (it.titleZh || ""));
    it.tagZh = getTagZh(it.kind);
    it.tagZhtw = toZhTw(it.tagZh);

    // 翻译或清洗中文标题
    if (!it.titleZh || it.titleZh === it.title) {
      if (/[a-zA-Z]{3,}/.test(it.title)) {
        console.log(`  -> 翻译: "${it.title.slice(0, 35)}..."`);
        it.titleZh = await translateEnToZh(it.title);
      } else {
        it.titleZh = it.title;
      }
    } else {
      // 既有 titleZh 重新过一遍术语清洗，消除翻译残渣
      for (const [re, rep] of POST_REPLACEMENTS) {
        it.titleZh = it.titleZh.replace(re, rep);
      }
    }

    // 生成繁体标题
    it.titleZhtw = toZhTw(it.titleZh);
  }

  const result = {
    updated: new Date().toISOString(),
    total: finalItems.length,
    items: finalItems
  };

  writeFileSync(newsPath, JSON.stringify(result, null, 2), "utf8");
  console.log(`✅ 成功更新 news.json，共 ${finalItems.length} 条热点资讯（已完成中繁多语言翻译与分类）。`);
}

main().catch(err => {
  console.error("fetch_news 致命错误:", err);
  process.exit(1);
});
