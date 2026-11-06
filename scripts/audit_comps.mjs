import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const load = (file, name) => {
  const ctx = {};
  vm.runInNewContext(fs.readFileSync(path.join(repo, file), 'utf8') + '\n;globalThis.OUT = ' + name + ';', ctx);
  return ctx.OUT;
};

const POOL = load('pool.js', 'POOL');
const TRIBES = load('data.js', 'TRIBES');
const NOTES = load('comp-notes.js', 'COMP_NOTES');

const byName = new Map();
for (const p of POOL) if (!byName.has(p.n)) byName.set(p.n, p);

const tierCap = (turn) => turn <= 3 ? 2 : turn <= 5 ? 3 : turn <= 7 ? 4 : turn <= 9 ? 5 : 6;
const hardCap = (turn) => tierCap(turn) + 1; // 升两本以上视为不可能

function resolve(token) {
  const t = String(token).trim().replace(/[（(].*?[）)]/g, '').trim();
  if (!t) return null;
  if (byName.has(t)) return byName.get(t);
  const starts = POOL.filter(p => p.n.startsWith(t));
  if (starts.length === 1) return starts[0];
  const within = POOL.filter(p => p.n.includes(t) || t.includes(p.n));
  if (within.length === 1) return within[0];
  return { missing: true, token: t, candidates: within.slice(0, 3).map(p => p.n) };
}

const findings = [];
const add = (level, where, msg) => findings.push({ level, where, msg });

function mentions(text) {
  const out = [];
  for (const m of String(text || '').matchAll(/【([^】]+)】/g)) {
    for (const raw of m[1].split('/')) {
      const token = raw.trim();
      if (!token) continue;
      if (token.length > 8) continue;
      if (/[+，。：]/.test(token)) continue;
      out.push(token);
    }
  }
  return out;
}

function turnOf(round) {
  const all = String(round).match(/\d+/g);
  return all && all.length ? Math.max(...all.map(Number)) : null;
}

// --- 1) 数值算式校验：a × b × c = d / a + b = c
function checkMath(text, where) {
  const s = String(text || '');
  for (const m of s.matchAll(/(?:(\d[\d,]*)\s*\+\s*)?(\d[\d,]*)\s*[×x]\s*(\d[\d,]*)(?:\s*[×x]\s*(\d[\d,]*))?\s*=\s*(\d[\d,]*)/g)) {
    const add = m[1] === undefined ? 0 : Number(m[1].replace(/,/g, ''));
    const b = Number(m[2].replace(/,/g, ''));
    const c = m[3] === undefined ? null : Number(m[3].replace(/,/g, ''));
    const d = Number(m[5].replace(/,/g, ''));
    const expect = add + (c === null ? b : b * c);
    if (Math.abs(expect - d) > Math.max(1, d * 0.02)) add('ERROR', where, '算式不成立: ' + m[0] + '（应为 ' + expect + '）');
  }
  for (const m of s.matchAll(/(\d[\d,]*)\s*\+\s*(\d[\d,]*)\s*=\s*(\d[\d,]*)/g)) {
    const a = Number(m[1].replace(/,/g, '')), b = Number(m[2].replace(/,/g, '')), d = Number(m[3].replace(/,/g, ''));
    if (a + b !== d) add('ERROR', where, '加法不成立: ' + m[0]);
  }
}

// --- 2) 阵容笔记
for (const [key, note] of Object.entries(NOTES)) {
  const where = 'comp:' + key;
  (note.order || []).forEach(n => { const r = resolve(n); if (r?.missing) add('ERROR', where, '阵容卡名未收录: ' + n); });
  const flat = [note.pos, note.whyBest, note.growth, note.trinket?.synergy].concat(
    Object.values(note.cardsMapping || {}), (note.steps || []).map(s => s.desc),
    (note.mistakes || []), (note.transitions || []).map(t => [t.pick, t.replace, t.drop, t.hold, t.trigger, t.final].join(' '))
  );
  for (const text of flat) for (const tok of mentions(text)) { const r = resolve(tok); if (r?.missing) add('ERROR', where, '卡名未收录: 「' + tok + '」' + (r.candidates.length ? '（疑似 ' + r.candidates.join(' / ') + '）' : '')); }
  const NAMES_DESC = [...byName.keys()].sort((a, b) => b.length - a.length);
  const cardsInText = (text) => {
    const t = String(text || '');
    const hits = new Set();
    let rest = t;
    for (const n of NAMES_DESC) {
      if (n.length < 3) continue;
      if (rest.includes(n)) { hits.add(n); rest = rest.split(n).join(''.padEnd(n.length, ' ')); }
    }
    return [...hits];
  };
  for (const step of note.mathExample?.steps || []) {
    const turn = turnOf(step.round);
    const cap = turn ? tierCap(turn) : null;
    const text = [step.state, step.math].join(' ');
    const negated = /拿不到|搜不到|还没到|尚未到场|不在手上/.test(text);
    for (const name of (negated ? [] : cardsInText(text))) {
      const r = byName.get(name);
      if (r && turn && hardCap(turn) && r.t > hardCap(turn)) add('ERROR', where, '第 ' + turn + ' 回合出现 ' + r.t + ' 本卡「' + r.n + '」（该回合实际上限约 ' + cap + ' 本）');
      else if (r && !r.missing && turn && cap && r.t > cap) add('WARN', where, '第 ' + turn + ' 回合出现 ' + r.t + ' 本卡「' + r.n + '」（需极限升本）');
    }
    checkMath(step.math, where + ' / ' + step.round);
    const claimed = (note.order || []).filter(n => text.includes(n));
  }
}

// --- 3) 种族页
for (const tribe of TRIBES) {
  const where = 'tribe:' + tribe.id;
  const example = tribe.scaling?.concreteExample;
  if (example) {
    checkMath(example.math, where + ' / 推演');
    for (const tok of mentions(example.math)) { const r = resolve(tok); if (r?.missing) add('ERROR', where, '卡名未收录: 「' + tok + '」' + (r.candidates.length ? '（疑似 ' + r.candidates.join(' / ') + '）' : '')); }
  }
  for (const text of [(tribe.scaling?.resource), (tribe.scaling?.carrier), ...(tribe.scaling?.pipeline || []).map(p => p.desc)]) {
    for (const tok of mentions(text)) { const r = resolve(tok); if (r?.missing) add('ERROR', where, '卡名未收录: 「' + tok + '」' + (r.candidates.length ? '（疑似 ' + r.candidates.join(' / ') + '）' : '')); }
  }
  for (const core of tribe.cores || []) if (!byName.has(core.n)) {
    const r = resolve(core.n);
    if (r?.missing) add('WARN', where, '核心卡未收录: ' + core.n + (r.candidates.length ? '（疑似 ' + r.candidates.join(' / ') + '）' : ''));
  }
}

// --- 输出
const errors = findings.filter(f => f.level === 'ERROR');
const warns = findings.filter(f => f.level === 'WARN');
if (process.argv.includes('--json')) { console.log(JSON.stringify(findings, null, 2)); }
else {
  for (const f of findings) console.log('[' + f.level + '] ' + f.where + ' :: ' + f.msg);
  console.log('---');
  console.log('ERROR ' + errors.length + ' / WARN ' + warns.length + ' / 卡池 ' + byName.size + ' 条 / 阵容 ' + Object.keys(NOTES).length + ' / 种族 ' + TRIBES.length);
}