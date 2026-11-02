#!/usr/bin/env node
/** 抓取社区热点，生成 news.json（Reddit / Google News / Hearthpwn） */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const H = { "user-agent": "Mozilla/5.0 (compatible; tavern-tome/1.0)" };

function decode(s){
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}
function strip(s){ return decode(String(s || "").replace(/<[^>]+>/g, "")).trim(); }

async function get(url){
  const r = await fetch(url, { headers: H });
  if(!r.ok) throw new Error(url + " " + r.status);
  return r.text();
}

function parseReddit(xml){
  const out = [];
  const re = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while((m = re.exec(xml))){
    const b = m[1];
    const title = strip((b.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1]);
    const link = (b.match(/<link[^>]*href="([^"]+)"/) || [])[1];
    const updated = (b.match(/<updated>([^<]+)<\/updated>/) || [])[1];
    if(title && link) out.push({ source: "Reddit", title, url: link, ts: updated ? Date.parse(updated) : Date.now(), kind: "discussion" });
  }
  return out;
}

function parseRss(xml){
  const out = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while((m = re.exec(xml))){
    const b = m[1];
    const title = strip((b.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1]);
    const link = strip((b.match(/<link>([\s\S]*?)<\/link>/) || [])[1]);
    const date = (b.match(/<pubDate>([^<]+)<\/pubDate>/) || [])[1];
    const src = strip((b.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1]);
    if(title && link) out.push({ source: src || "News", title, url: link, ts: date ? Date.parse(date) : Date.now(), kind: "news" });
  }
  return out;
}

const items = [];
try { items.push(...parseReddit(await get("https://www.reddit.com/r/BobsTavern/.rss")).slice(0, 8)); }
catch(e){ console.error("reddit", e.message); }
try { items.push(...parseRss(await get("https://news.google.com/rss/search?q=%E9%85%92%E9%A6%86%E6%88%98%E6%A3%8B&hl=zh-CN&gl=CN&ceid=CN:zh-Hans")).slice(0, 6)); }
catch(e){ console.error("google-zh", e.message); }
try { items.push(...parseRss(await get("https://news.google.com/rss/search?q=Battlegrounds+Hearthstone&hl=en-US&gl=US&ceid=US:en")).slice(0, 6)); }
catch(e){ console.error("google-en", e.message); }
try { items.push(...parseRss(await get("https://www.hearthpwn.com/news.rss")).filter(x => /battleground|tavern/i.test(x.title)).slice(0, 4)); }
catch(e){ console.error("hearthpwn", e.message); }

items.sort((a, b) => b.ts - a.ts);
const seen = new Set();
const uniq = items.filter(x => { const k = x.title; if(seen.has(k)) return false; seen.add(k); return true; }).slice(0, 16);

writeFileSync(resolve(root, "news.json"), JSON.stringify({ updated: new Date().toISOString(), items: uniq }, null, 1));
console.log("news items:", uniq.length);
